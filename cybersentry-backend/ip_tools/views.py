from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    WhoisLookupSerializer,
    IpReputationSerializer,
    ReverseIpSerializer,
)
from .services import (
    WhoisLookupError,
    IpLookupError,
    perform_whois_lookup,
    get_ip_reputation,
    reverse_ip_lookup,
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
