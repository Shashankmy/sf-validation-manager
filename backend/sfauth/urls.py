from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login, name='sf_login'),
    path('callback/', views.callback, name='sf_callback'),
    path('logout/', views.logout, name='sf_logout'),
    path('status/', views.user_status, name='user_status'),
]
