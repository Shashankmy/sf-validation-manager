import requests
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json


def get_session_tokens(request):
    """
    Try headers first (sent by frontend via localStorage),
    then fall back to session. Fixes cross domain cookie issue.
    """
    access_token = request.headers.get('X-SF-Access-Token') or request.session.get('access_token')
    instance_url = request.headers.get('X-SF-Instance-URL') or request.session.get('instance_url')
    return access_token, instance_url


def not_authenticated():
    return JsonResponse(
        {'error': 'Not authenticated. Please login first.'},
        status=401
    )


@require_http_methods(["GET"])
def get_validation_rules(request):
    access_token, instance_url = get_session_tokens(request)
    if not access_token:
        return not_authenticated()

    query = (
        "SELECT Id, ValidationName, Active, Description, ErrorMessage "
        "FROM ValidationRule "
        "WHERE EntityDefinition.QualifiedApiName = 'Account'"
    )

    tooling_url = f"{instance_url}/services/data/v59.0/tooling/query"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }

    try:
        resp = requests.get(tooling_url, headers=headers, params={'q': query})

        if resp.status_code == 401:
            return JsonResponse({'error': 'Session expired, please login again.'}, status=401)

        if resp.status_code != 200:
            return JsonResponse(
                {'error': f'Salesforce API error: {resp.text}'},
                status=resp.status_code
            )

        data = resp.json()
        rules = []
        for record in data.get('records', []):
            rules.append({
                'id': record.get('Id'),
                'name': record.get('ValidationName'),
                'active': record.get('Active'),
                'description': record.get('Description') or '',
                'error_message': record.get('ErrorMessage') or '',
            })

        return JsonResponse({'rules': rules, 'total': len(rules)})

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': f'Failed to connect to Salesforce: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def toggle_rule(request, rule_id):
    access_token, instance_url = get_session_tokens(request)
    if not access_token:
        return not_authenticated()

    try:
        body = json.loads(request.body)
        new_status = body.get('active')
        if new_status is None:
            return JsonResponse({'error': 'active field is required'}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)

    tooling_url = f"{instance_url}/services/data/v59.0/tooling/sobjects/ValidationRule/{rule_id}"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }

    try:
        get_resp = requests.get(tooling_url, headers=headers)
        if get_resp.status_code != 200:
            return JsonResponse(
                {'error': f'Could not fetch rule: {get_resp.text}'},
                status=get_resp.status_code
            )

        rule_data = get_resp.json()
        metadata = rule_data.get('Metadata', {})
        metadata['active'] = new_status

        patch_resp = requests.patch(
            tooling_url,
            headers=headers,
            json={'Metadata': metadata}
        )

        if patch_resp.status_code == 204:
            return JsonResponse({
                'success': True,
                'rule_id': rule_id,
                'active': new_status,
                'message': f"Rule {'activated' if new_status else 'deactivated'} successfully"
            })
        else:
            return JsonResponse(
                {'error': f'Failed to update rule: {patch_resp.text}'},
                status=patch_resp.status_code
            )

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': f'Request failed: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def deploy_rules(request):
    access_token, instance_url = get_session_tokens(request)
    if not access_token:
        return not_authenticated()

    try:
        body = json.loads(request.body)
        rule_updates = body.get('rules', [])
        if not rule_updates:
            return JsonResponse({'error': 'No rules provided'}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }

    results = []
    errors = []

    for rule in rule_updates:
        rule_id = rule.get('id')
        new_status = rule.get('active')

        if not rule_id or new_status is None:
            errors.append({'id': rule_id, 'error': 'Missing id or active field'})
            continue

        tooling_url = f"{instance_url}/services/data/v59.0/tooling/sobjects/ValidationRule/{rule_id}"

        try:
            get_resp = requests.get(tooling_url, headers=headers)
            if get_resp.status_code != 200:
                errors.append({'id': rule_id, 'error': 'Could not fetch rule metadata'})
                continue

            rule_data = get_resp.json()
            metadata = rule_data.get('Metadata', {})
            metadata['active'] = new_status

            patch_resp = requests.patch(
                tooling_url,
                headers=headers,
                json={'Metadata': metadata}
            )

            if patch_resp.status_code == 204:
                results.append({'id': rule_id, 'active': new_status, 'status': 'updated'})
            else:
                errors.append({'id': rule_id, 'error': patch_resp.text})

        except Exception as e:
            errors.append({'id': rule_id, 'error': str(e)})

    return JsonResponse({
        'success': len(errors) == 0,
        'updated': results,
        'failed': errors,
        'message': f"{len(results)} rule(s) deployed, {len(errors)} failed"
    })