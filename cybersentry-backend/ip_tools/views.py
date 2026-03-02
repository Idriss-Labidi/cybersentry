from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    WhoisLookupSerializer,
    IpReputationSerializer,
    ReverseIpSerializer,
    TyposquattingDetectionSerializer,
    IPReputationScanSerializer,
    DomainTyposquattingScanSerializer,
)
from .services import (
    WhoisLookupError,
    IpLookupError,
    perform_whois_lookup,
    get_ip_reputation,
    reverse_ip_lookup,
    check_ip_reputation_with_history,
    detect_typosquatting_with_history,
    get_user_ip_scan_history,
    get_user_typosquatting_scan_history,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def whois_lookup(request):
    """WHOIS lookup for a domain name or IP address."""
    serializer = WhoisLookupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    query = serializer.validated_data['query']

    try:
        result = perform_whois_lookup(query)
    except WhoisLookupError as exc:
        return Response({'message': str(exc)}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'query': query,
        'result': result,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def ip_reputation(request):
    """IP reputation score and geolocation information."""
    serializer = IpReputationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    ip_address = serializer.validated_data['ip_address']

    try:
        result = get_ip_reputation(ip_address)
    except IpLookupError as exc:
        return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(result, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reverse_ip(request):
    """Reverse IP lookup — hostname + domains hosted on the same IP."""
    serializer = ReverseIpSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    ip_address = serializer.validated_data['ip_address']
    result = reverse_ip_lookup(ip_address)

    return Response(result, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def advanced_ip_reputation(request):
    """
    Endpoint avancé pour vérifier la réputation IP avec sauvegarde de l'historique.
    Nécessite l'authentification.
    """
    serializer = IpReputationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    ip_address = serializer.validated_data['ip_address']

    try:
        result = check_ip_reputation_with_history(ip_address, user=request.user)
    except IpLookupError as exc:
        return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(result, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def typosquatting_detection(request):
    """
    Détection de typosquatting pour un domaine donné.
    Nécessite l'authentification et sauvegarde dans l'historique.
    """
    serializer = TyposquattingDetectionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    domain = serializer.validated_data['domain']

    try:
        result = detect_typosquatting_with_history(domain, user=request.user)
    except Exception as exc:
        return Response(
            {'message': f'Error detecting typosquatting: {str(exc)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scan_history(request):
    """
    Récupère l'historique complet des scans (IP reputation + typosquatting).
    Nécessite l'authentification.
    """
    limit = int(request.query_params.get('limit', 50))

    ip_scans = get_user_ip_scan_history(request.user, limit=limit)
    typosquatting_scans = get_user_typosquatting_scan_history(request.user, limit=limit)

    return Response({
        'ip_scans': IPReputationScanSerializer(ip_scans, many=True).data,
        'typosquatting_scans': DomainTyposquattingScanSerializer(typosquatting_scans, many=True).data,
    }, status=status.HTTP_200_OK)

