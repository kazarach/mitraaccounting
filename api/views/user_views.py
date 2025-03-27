from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import UserAccount, UserRole
from ..serializers import (
    UserAccountSerializer, 
    UserRegistrationSerializer, 
    UserRoleSerializer
)

class UserRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user roles
    """
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [permissions.IsAdminUser]

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

    @action(detail=False, methods=['GET'], 
            permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Get current user's profile
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'], 
            permission_classes=[permissions.IsAdminUser])
    def by_role(self, request):
        """
        Get users filtered by role
        """
        role_id = request.query_params.get('role_id')
        if not role_id:
            return Response(
                {"error": "role_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = UserAccount.objects.filter(role_id=role_id)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)