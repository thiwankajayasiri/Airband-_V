from setuptools import setup

setup(
    name='V16_API',
    packages=['V16_API'],
    include_package_data=True,
    install_requires=[
        'flask', 'flask-bootstrap', 'flask-nav', 'pyserial', 'flask_wtf', 'numpy', 'gunicorn'
    ],
)
