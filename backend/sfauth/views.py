import os
import requests
import urllib.parse
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

SF_CLIENT_ID = os.getenv('SF_CLIENT_ID')
SF_CLIENT_SECRET = os.getenv('SF_CLIENT_SECRET')
SF_DOMAIN = os.getenv('SF_DOMAIN')
REDIRECT_URI = os.getenv('REDIRECT_URI')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')


def login(request):
    # redirect user to salesforce oauth login page
    auth_url = (
        f"{SF_DOMAIN}/services/oauth2/authorize"
        f"?response_type=code"
        f"&client_id={SF_CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope=full+refresh_token+offline_access"
    )
    return redirect(auth_url)


def callback(request):
    code = request.GET.get('code')
    error = request.GET.get('error')

    if error:
        return redirect(f"{FRONTEND_URL}?error={error}")

    if not code:
        return redirect(f"{FRONTEND_URL}?error=no_code_returned")

    token_url = f"{SF_DOMAIN}/services/oauth2/token"
    payload = {
        'grant_type': 'authorization_code',
        'client_id': SF_CLIENT_ID,
        'client_secret': SF_CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'code': code,
    }

    try:
        resp = requests.post(token_url, data=payload)
        token_data = resp.json()
    except Exception:
        return redirect(f"{FRONTEND_URL}?error=token_exchange_failed")

    if 'error' in token_data:
        err_msg = token_data.get('error_description', 'unknown_error')
        return redirect(f"{FRONTEND_URL}?error={err_msg}")

    access_token = token_data.get('access_token')
    instance_url = token_data.get('instance_url')
    user_name = 'Salesforce User'
    user_email = ''

    # get user info from salesforce
    user_info_url = token_data.get('id')
    if user_info_url:
        try:
            user_resp = requests.get(
                user_info_url,
                headers={'Authorization': f"Bearer {access_token}"}
            )
            user_data = user_resp.json()
            user_name = user_data.get('display_name', 'Salesforce User')
            user_email = user_data.get('email', '')
        except Exception:
            pass

    # store in session as backup
    request.session['access_token'] = access_token
    request.session['instance_url'] = instance_url
    request.session['user_name'] = user_name
    request.session['user_email'] = user_email

    # pass token in URL so frontend stores in localStorage
    # this fixes the cross domain cookie issue in production
    params = urllib.parse.urlencode({
        'access_token': access_token,
        'instance_url': instance_url,
        'user_name': user_name,
        'user_email': user_email,
    })
    return redirect(f"{FRONTEND_URL}/dashboard?{params}")


@require_http_methods(["GET"])
def user_status(request):
    access_token = request.session.get('access_token')
    if not access_token:
        return JsonResponse({'logged_in': False})

    return JsonResponse({
        'logged_in': True,
        'user_name': request.session.get('user_name', 'Salesforce User'),
        'user_email': request.session.get('user_email', ''),
        'instance_url': request.session.get('instance_url', ''),
    })


@csrf_exempt
@require_http_methods(["POST"])
def logout(request):
    access_token = request.session.get('access_token')
    instance_url = request.session.get('instance_url')

    if access_token and instance_url:
        try:
            revoke_url = f"{instance_url}/services/oauth2/revoke"
            requests.post(revoke_url, data={'token': access_token})
        except Exception:
            pass

    request.session.flush()
    return JsonResponse({'success': True, 'message': 'Logged out successfully'})


@csrf_exempt
@require_http_methods(["POST"])
def token_login(request):
    """
    Frontend sends access_token + instance_url, we store in session.
    Bridges the gap between URL params and server session.
    """
    try:
        body = json.loads(request.body)
        access_token = body.get('access_token')
        instance_url = body.get('instance_url')
        user_name = body.get('user_name', 'Salesforce User')
        user_email = body.get('user_email', '')

        if not access_token or not instance_url:
            return JsonResponse({'error': 'Missing token or instance_url'}, status=400)

        request.session['access_token'] = access_token
        request.session['instance_url'] = instance_url
        request.session['user_name'] = user_name
        request.session['user_email'] = user_email

        return JsonResponse({'success': True, 'logged_in': True, 'user_name': user_name})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)