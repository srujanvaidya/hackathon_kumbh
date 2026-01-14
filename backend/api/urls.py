from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    path('stats/', views.get_stats, name='get_stats'),
    path('users/', views.get_users, name='get_users'),
    path('users/create/', csrf_exempt(views.create_user), name='create_user'),
    path('users/delete/', views.delete_user, name='delete_user'),
    path('users/<str:band_id>/', views.get_user, name='get_user'),
    path('fund/', csrf_exempt(views.fund_band), name='fund_band'),
    path('block/', csrf_exempt(views.block_band), name='block_band'),
    path('payment/', csrf_exempt(views.process_payment), name='process_payment'),
    path('sellers/register/', csrf_exempt(views.register_seller), name='register_seller'),
    path('sellers/login/', csrf_exempt(views.seller_login), name='seller_login'),
    path('scan/', views.scan_handler, name='scan_handler'),
]
