from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample

from ..models import UserAccount, UserRole
from ..serializers import (
    UserAccountSerializer, 
    UserRegistrationSerializer, 
    UserRoleSerializer
)

@extend_schema_view(
    list=extend_schema(
        summary="List roles",
        description="Get a list of all user roles. Admin access required.",
        responses={200: UserRoleSerializer(many=True)},
        tags=["User"]
    ),
    retrieve=extend_schema(
        summary="Retrieve role",
        description="Get detailed information about a specific user role. Admin access required.",
        responses={200: UserRoleSerializer},
        tags=["User"]
    ),
    create=extend_schema(
        summary="Create role",
        description="Create a new user role. Admin access required.",
        responses={201: UserRoleSerializer},
        tags=["User"]
    ),
    update=extend_schema(
        summary="Update role",
        description="Update all fields of an existing user role. Admin access required.",
        responses={200: UserRoleSerializer},
        tags=["User"]
    ),
    partial_update=extend_schema(
        summary="Partial update role",
        description="Update one or more fields of an existing user role. Admin access required.",
        responses={200: UserRoleSerializer},
        tags=["User"]
    ),
    destroy=extend_schema(
        summary="Delete role",
        description="Delete an existing user role. Admin access required.",
        responses={204: None},
        tags=["User"]
    )
)
class UserRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user roles
    """
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [permissions.IsAdminUser]

@extend_schema_view(
    list=extend_schema(
        summary="List accounts",
        description="Get a list of all user accounts. Admin access required.",
        responses={200: UserAccountSerializer(many=True)},
        tags=["User"]
    ),
    retrieve=extend_schema(
        summary="Retrieve account",
        description="Get detailed information about a specific user account. Admin access required.",
        responses={200: UserAccountSerializer},
        tags=["User"]
    ),
    create=extend_schema(
        summary="Create account",
        description="Create a new user account. Admin access required.",
        responses={201: UserRegistrationSerializer},
        tags=["User"]
    ),
    update=extend_schema(
        summary="Update account",
        description="Update all fields of an existing user account. Admin access required.",
        responses={200: UserAccountSerializer},
        tags=["User"]
    ),
    partial_update=extend_schema(
        summary="Partial update account",
        description="Update one or more fields of an existing user account. Admin access required.",
        responses={200: UserAccountSerializer},
        tags=["User"]
    ),
    destroy=extend_schema(
        summary="Delete account",
        description="Delete an existing user account. Admin access required.",
        responses={204: None},
        tags=["User"]
    )
)
class UserAccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user accounts
    """
    queryset = UserAccount.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """
        Use different serializers for different actions
        """
        if self.action == 'create' or self.action == 'register':
            return UserRegistrationSerializer
        return UserAccountSerializer

    def get_permissions(self):
        """
        Custom permission logic
        """
        if self.action in ['create', 'register', 'list']:
            permission_classes = [permissions.IsAdminUser]
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Register new user",
        description="Register a new user account. This endpoint is available to anyone.",
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiExample(
                'Registration successful',
                value={
                    "user": {
                        "id": 1,
                        "email": "user@example.com",
                        "full_name": "Test User",
                        "role": {
                            "id": 2,
                            "name": "Staff"
                        },
                        "is_active": True
                    },
                    "message": "User registered successfully"
                },
                response_only=True
            ),
            400: OpenApiExample(
                'Registration failed',
                value={"email": ["This field is required."]},
                response_only=True
            )
        },
        tags=["User"]
    )
    @action(detail=False, methods=['POST'], 
            permission_classes=[permissions.AllowAny], 
            serializer_class=UserRegistrationSerializer)
    def register(self, request):
        """
        User registration endpoint
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserAccountSerializer(user).data,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Get current profile",
        description="Get the profile information of the currently authenticated user.",
        responses={200: UserAccountSerializer},
        tags=["User"]
    )
    @action(detail=False, methods=['GET'], 
            permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Get current user's profile
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        summary="Get users by roles",
        description="Get users filtered by their assigned roles. Admin access required.",
        parameters=[
            OpenApiParameter(
                name='role_ids',
                description='Comma-separated list of role IDs to filter users by (e.g., role_ids=1,2,3)',
                required=True,
                type=str
            )
        ],
        responses={
            200: UserAccountSerializer(many=True),
            400: OpenApiExample(
                'Missing or invalid role_ids',
                value={"error": "role_ids parameter is required"},
                response_only=True
            )
        },
        tags=["User"]
    )
    @action(detail=False, methods=['GET'], 
            permission_classes=[permissions.IsAdminUser])
    def by_role(self, request):
        """
        Get users filtered by multiple roles (via comma-separated role_ids)
        """
        role_ids = request.query_params.get('role_ids')
        if not role_ids:
            return Response(
                {"error": "role_ids parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            role_ids_list = [int(rid.strip()) for rid in role_ids.split(',') if rid.strip().isdigit()]
        except ValueError:
            return Response({"error": "Invalid role_ids format"}, status=status.HTTP_400_BAD_REQUEST)

        users = UserAccount.objects.filter(role_id__in=role_ids_list)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get users with role 'cashier' and above",
        description="Returns users whose roles have level greater than or equal to 'cashier' level.",
        responses={200: UserAccountSerializer(many=True)},
        tags=["User"]
    )
    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAdminUser])
    def cashier_and_above(self, request):
        """
        Get users who are 'cashier' or higher in role hierarchy
        """
        try:
            cashier_role = UserRole.objects.get(name__iexact="cashier")
            # Get users with role level >= cashier level
            users = UserAccount.objects.filter(role__level__gte=cashier_role.level)
            serializer = self.get_serializer(users, many=True)
            return Response(serializer.data)
        except UserRole.DoesNotExist:
            return Response({"error": "cashier role not found"}, status=status.HTTP_404_NOT_FOUND)
