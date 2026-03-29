from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from accounts.services import ensure_user_organization
from assets.models import Asset
from assets.services import sync_linked_asset_score
from .serializers import (
    DNSLookupSerializer,
    DNSPropagationSerializer,
    DnsServerSerializer,
    DNSHealthCheckSerializer,
    DNSHealthScanSerializer,
)
from .models import DNSHealthScan, DnsServer
from .services import (
    DomainNotFoundError,
    check_dns_propagation,
    perform_dns_lookup,
    dns_health_check
)
from collections import defaultdict

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_resource(request):
    """
    Example protected endpoint.
    Only accessible with valid access token.
    """
    return Response({
        'message': 'This is a protected resource',
        'user': request.user.username,
        'scopes': request.auth.scope if request.auth else None,
        'data': {
            'items': [
                {'id': 1, 'name': 'Item 1'},
                {'id': 2, 'name': 'Item 2'},
            ]
        }
    })

@api_view(['POST'])   
@permission_classes([AllowAny])
def dns_lookup(request):
    serializer = DNSLookupSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    domain_name = validated_data['domain_name']
    r_types = validated_data['record_types']
    
    try:
        response = perform_dns_lookup(domain_name, r_types)
    except DomainNotFoundError:
        return Response({'message': 'the domain name does not exist'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'domain': domain_name,
        'result': response
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def dns_propagation(request):
    serializer = DNSPropagationSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    validated_data = serializer.validated_data
    domain_name = validated_data['domain_name']
    r_types = validated_data['record_types']
    regions = validated_data.get('regions')
    timeout = validated_data.get('timeout') or 2.0
    lifetime = validated_data.get('lifetime') or timeout
    retries = validated_data.get('retries') or 0
    ip = validated_data.get('ip_version')
    
    servers_qs = DnsServer.objects.filter(region__in=regions, type=ip) if regions else DnsServer.objects.all()

    resolvers_by_region = defaultdict(list)
    for server in servers_qs:
        resolvers_by_region[server.region].append(server)

    if regions and not resolvers_by_region:
        return Response({'message': 'No DNS servers configured for requested regions'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        propagation = check_dns_propagation(
            domain_name=domain_name,
            record_types=r_types,
            regions=regions,
            timeout=timeout,
            lifetime=lifetime,
            retries=retries,
            resolvers_by_region=resolvers_by_region
        )
    except DomainNotFoundError:
        return Response({'message': 'the domain name does not exist'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as exc:
        return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'domain': domain_name,
        'record_types': r_types,
        'regions': regions or 'default',
        'timeout': timeout,
        'lifetime': lifetime,
        'retries': retries,
        'propagation': propagation
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def dns_health_check_(request):
    serializer = DNSHealthCheckSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    domain_name = data['domain_name']
    res = dns_health_check(domain_name)

    if request.user.is_authenticated:
        organization = ensure_user_organization(request.user)
        DNSHealthScan.objects.create(
            organization=organization,
            user=request.user,
            domain_name=domain_name,
            score=res.get('score', 0),
            grade=res.get('grade', 'Unknown'),
            checks=res.get('checks', {}),
            recommendations=res.get('recommendations', []),
        )
        sync_linked_asset_score(
            request.user,
            asset_type=Asset.AssetTypes.DOMAIN,
            value=domain_name,
            score=res.get('score', 0),
            source='dns-health',
            note='Score synced from DNS health check',
        )

    return Response(res, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dns_health_history(request):
    limit = int(request.query_params.get('limit', 50))
    scans = DNSHealthScan.objects.filter(user=request.user)[:limit]

    return Response({
        'dns_health_scans': DNSHealthScanSerializer(scans, many=True).data,
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_dns_health_history_entry(request, scan_id):
    deleted, _ = DNSHealthScan.objects.filter(id=scan_id, user=request.user).delete()

    if deleted == 0:
        return Response(
            {'error': 'DNS health scan not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(status=status.HTTP_204_NO_CONTENT)

class DnsServerList(APIView):
    '''
    List all dns servers or add a new one.
    '''
    permission_classes=[AllowAny]
    
    def get(self, request, format=None):
        servers = DnsServer.objects.all()
        serializer = DnsServerSerializer(servers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
            
    def post(self, request, format=None):
        serializer = DnsServerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DnsServerDetails(APIView):
    
    permission_classes=[AllowAny]
    
    def get(self, request, pk, format=None):
        try:
            server = DnsServer.objects.get(pk=pk)
        except DnsServer.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DnsServerSerializer(server)
        return Response(serializer.data, status=status.HTTP_200_OK)
