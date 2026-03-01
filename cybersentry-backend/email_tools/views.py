from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    EmailSecurityAnalysisSerializer,
    SPFAnalysisSerializer,
    DKIMAnalysisSerializer,
    DMARCAnalysisSerializer,
)
from .services import (
    analyze_email_security,
    analyze_spf,
    analyze_dkim,
    analyze_dmarc,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def email_security_analysis(request):
    """Combined SPF + DKIM + DMARC analysis."""
    serializer = EmailSecurityAnalysisSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    result = analyze_email_security(
        domain=data["domain_name"],
        dkim_selectors=data.get("dkim_selectors"),
    )
    return Response(result, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def spf_analysis(request):
    """SPF-only analysis."""
    serializer = SPFAnalysisSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    result = analyze_spf(serializer.validated_data["domain_name"])
    return Response(result, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def dkim_analysis(request):
    """DKIM-only analysis."""
    serializer = DKIMAnalysisSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    result = analyze_dkim(data["domain_name"], selectors=data.get("selectors"))
    return Response(result, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def dmarc_analysis(request):
    """DMARC-only analysis."""
    serializer = DMARCAnalysisSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    result = analyze_dmarc(serializer.validated_data["domain_name"])
    return Response(result, status=status.HTTP_200_OK)
