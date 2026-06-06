from django.urls import path
from . import views

urlpatterns = [
    path('rules/', views.get_validation_rules, name='get_rules'),
    path('rules/<str:rule_id>/toggle/', views.toggle_rule, name='toggle_rule'),
    path('rules/deploy/', views.deploy_rules, name='deploy_rules'),
]
