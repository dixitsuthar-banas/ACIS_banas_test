{
    'name': 'ACIS 3CX',
    'version': '18.0.1.0.2',
    'license': 'LGPL-3',
    'author': 'ACIS GmbH',
    'summary': '3CX Integration',
    'description': """
    My Description
    """,
    'category': 'Technical',
    'website': 'www.acis.at',
    'depends': [
        'base',
        'web',
        'voip',
    ],
    'data': [
        'views/res_users.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'voip/static/src/core/user_agent_service.js',
            'acis_3cx/static/src/**/*',
        ]
    }
}
