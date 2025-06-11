from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from api.views import UserAccountViewSet, UserRoleViewSet
from api.views import StockViewSet
from api.views import CategoryViewSet
from api.views import TransItemDetailViewSet, TransactionHistoryViewSet
from api.views import SupplierViewSet
from api.views import ARAPViewSet, ARAPPaymentViewSet
from api.views import CustomerViewSet
from api.views import BankViewSet
from api.views import PointTransactionViewSet, CustomerPointsViewSet
from api.views import StockChangeHistoryAPIView

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'users', UserAccountViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='role')
router.register(r'stock', StockViewSet, basename='stock')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionHistoryViewSet, basename='transaction')
router.register(r'trans-items', TransItemDetailViewSet, basename='transitem')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'araps', ARAPViewSet, basename='hutang_piutang')
# router.register(r'araps-transactions', ARAPTransactionViewSet, basename='transaksi_hutang_piutang')
router.register(r'arap-payments', ARAPPaymentViewSet, basename='bayar_hutang_piutang')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'banks', BankViewSet, basename='bank')
router.register(r'point-transactions', PointTransactionViewSet, basename='point_transaction')
router.register(r'customer-points', CustomerPointsViewSet, basename='point_customer')

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('stock-changes/', StockChangeHistoryAPIView.as_view(), name='stock-change-history'),
    path('', include(router.urls)),

    # OpenAPI schema
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    # Swagger UI
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # Redoc
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
