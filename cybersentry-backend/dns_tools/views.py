from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import DNSLookupSerializer, DNSPropagationSerializer
from .services import (
    DomainNotFoundError,
    check_dns_propagation,
    perform_dns_lookup,
)

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
def dns_propagation(request):
    serializer = DNSPropagationSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    domain_name = validated_data['domain_name']
    r_types = validated_data['record_types']
    regions = validated_data.get('regions')
    timeout = validated_data.get('timeout') or 5.0
    lifetime = validated_data.get('lifetime') or 5.0
    retries = validated_data.get('retries') or 0

    try:
        propagation = check_dns_propagation(
            domain_name=domain_name,
            record_types=r_types,
            regions=regions,
            timeout=timeout,
            lifetime=lifetime,
            retries=retries,
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
