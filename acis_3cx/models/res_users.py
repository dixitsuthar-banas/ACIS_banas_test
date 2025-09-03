# models/res_users.py
from odoo import models, fields

class ResUsers(models.Model):
    _inherit = 'res.users'

    extension_3cx = fields.Char(string='3CX Extension')
