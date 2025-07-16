from rest_framework import viewsets
from ..models import Account
from ..serializers.account_serializer import AccountSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema_view, extend_schema
from rest_framework.permissions import IsAuthenticated  # Optional

@extend_schema_view(
    list=extend_schema(
        summary="List Account",
        description="Get a list of all Account with pagination, filtering, and search capabilities.",
        responses={200: AccountSerializer(many=True)},
        tags=["Account"]
    ),
    retrieve=extend_schema(
        summary="Retrieve Account",
        description="Get detailed information about a specific Account.",
        responses={200: AccountSerializer},
        tags=["Account"]
    )
)
class AccountViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Account.objects.filter(is_active=True).order_by('account_number')
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]