import os
import requests
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

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
    # salesforce redirects back here with a code
    code = request.GET.get('code')
    error = request.GET.get('error')

    if error:
        return redirect(f"{FRONTEND_URL}?error={error}")

    if not code:
        return redirect(f"{FRONTEND_URL}?error=no_code_returned")

    # exchange the code for an access token
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
    except Exception as e:
        return redirect(f"{FRONTEND_URL}?error=token_exchange_failed")

    if 'error' in token_data:
        err_msg = token_data.get('error_description', 'unknown_error')
        return redirect(f"{FRONTEND_URL}?error={err_msg}")

    # store tokens in session
    request.session['access_token'] = token_data.get('access_token')
    request.session['instance_url'] = token_data.get('instance_url')
    request.session['refresh_token'] = token_data.get('refresh_token')

    # get user info from salesforce
    user_info_url = token_data.get('id')
    if user_info_url:
        try:
            user_resp = requests.get(
                user_info_url,
                headers={'Authorization': f"Bearer {token_data.get('access_token')}"}
            )
            user_data = user_resp.json()
            request.session['user_name'] = user_data.get('display_name', 'Salesforce User')
            request.session['user_email'] = user_data.get('email', '')
        except Exception:
            request.session['user_name'] = 'Salesforce User'
            request.session['user_email'] = ''

    return redirect(f"{FRONTEND_URL}/dashboard")


@require_http_methods(["GET"])
def user_status(request):
    # check if user is currently logged in
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
    # revoke token and clear session
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
