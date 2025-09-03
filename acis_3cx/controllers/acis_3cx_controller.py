from odoo import http, _
from odoo.http import request
import requests
import logging

_logger = logging.getLogger(__name__)


class Acis3cxController(http.Controller):

    @http.route('/acis_3cx/make_call', type='json', auth='user')
    def make_call(self, phone_number):
        # Get current user
        user = request.env.user

        # Get extension from user
        extension = user.sudo().extension_3cx
        if not extension:
            return {'error': _('Your 3CX extension is not configured')}

        # Get system parameters
        ICP = request.env['ir.config_parameter'].sudo()
        url = ICP.get_param('3cx_url')
        client_id = ICP.get_param('3cx_client_id')
        client_secret = ICP.get_param('3cx_client_secret')

        if not all([url, client_id, client_secret]):
            return {'error': _('Missing 3CX system configuration')}

        # Step 1: Get token
        try:
            token_response = requests.post(
                f"{url}/connect/token",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "grant_type": "client_credentials",
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
                timeout=5,
            )
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            if not access_token:
                _logger.warning("3CX token request succeeded but no token returned: %s", token_data)
                return {'error': _('Unable to authenticate with 3CX')}
        except Exception as e:
            _logger.exception("Token request to 3CX failed")
            return {'error': _('Unable to authenticate with 3CX')}

        # Step 2: Make call
        try:
            call_response = requests.post(
                f"{url}/xapi/v1/Users/Pbx.MakeCall",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "dn": extension,
                    "destination": phone_number,
                },
                timeout=5,
            )

            if call_response.status_code != 200:
                _logger.warning("3CX call failed: status=%s response=%s", call_response.status_code, call_response.text)
                return {
                    'error': (
                        _('Call request failed: %s') % call_response.text
                        if call_response.text
                        else _('Call request failed with status %s') % call_response.status_code
                    )
                }
            return {'success': True}

        except Exception as e:
            _logger.exception("Call request to 3CX failed")
            return {'error': _('An error occurred while trying to initiate the call')}
