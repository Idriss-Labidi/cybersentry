from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import DNSLookupSerializer
import dns.resolver


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get the authenticated user's profile.
    Requires valid OAuth2 access token.
    """
    user = request.user
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': user.get_full_name(),
    })


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
@permission_classes([IsAuthenticated])
def create_resource(request):
    """
    Create a new resource (example).
    Requires 'write' scope.
    """
    # Check if user has write scope
    # if request.auth and 'write' not in request.auth.scope:
    #     return Response(
    #         {'error': 'Insufficient permissions. Requires write scope.'},
    #         status=status.HTTP_403_FORBIDDEN
    #     )
    
    # Your creation logic here
    data = request.data
    
    return Response({
        'message': 'Resource created successfully',
        'data': data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def public_endpoint(request):
    """
    Public endpoint - no authentication required.
    """
    return Response({
        'message': 'This is a public endpoint',
        'authenticated': request.user.is_authenticated,
    })
 
@api_view(['POST'])   
def dns_lookup(request):
    serializer = DNSLookupSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    domain_name = validated_data['domain_name']
    r_types = validated_data['record_types']
    
    response = {}
    
    for r_type in r_types:
        try:
            result = dns.resolver.resolve(domain_name, r_type)
        except dns.resolver.NoAnswer:
            response[r_type] = f'No{r_type} record found for {domain_name}'
        except dns.resolver.NXDOMAIN:
            return Response({ 'message': 'the domain name does not exist'},status=status.HTTP_404_NOT_FOUND)
        response[r_type] = [rr.to_text() for rr in result]
    
    return Response({
        'domain': domain_name,
        'result': response
    }, status=status.HTTP_200_OK)
    



