from flask_nav import Nav
from flask_nav.elements import *

nav = Nav()


@nav.navigation()
def mynavbar():
    return Navbar(
        'Cobalt Web Utility',
        View('Home', 'index')
    )
