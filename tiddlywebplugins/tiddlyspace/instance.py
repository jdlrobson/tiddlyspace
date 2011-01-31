"""
structure and contents of a default TiddlySpace instance
"""

from copy import deepcopy

from tiddlywebplugins.instancer.util import get_tiddler_locations

from tiddlywebwiki.instance import (instance_config, store_contents,
    store_structure)

from tiddlywebplugins.prettyerror.instance import (
         store_contents as prettyerror_store_contents,
         store_structure as prettyerror_store_structure)

from tiddlywebplugins.tiddlyspace.space import Space


store_contents.update(get_tiddler_locations(
    prettyerror_store_contents, 'tiddlywebplugins.prettyerror'))
store_structure['bags'].update(prettyerror_store_structure['bags'])
store_structure['recipes'].update(prettyerror_store_structure['recipes'])
store_contents['_errors'] = ['src/errors/index.recipe']

instance_config['system_plugins'] = ['tiddlywebplugins.tiddlyspace']
instance_config['twanager_plugins'] = ['tiddlywebplugins.tiddlyspace']

store_contents['system'].append(
        'http://github.com/cdent/lazytiddlers/raw/master/LazyTiddlersPlugin.js')
store_contents['common'] = ['src/common.recipe']
store_contents['tiddlyspace'] = ['src/tiddlyspace.recipe']
store_contents['system-info_public'] = ['src/system-info/index.recipe']
store_contents['system-plugins_public'] = ['src/system-plugins/index.recipe']
store_contents['system-theme_public'] = ['src/system-theme/index.recipe']
store_contents['system-images_public'] = ['src/system-images/index.recipe']
store_contents['frontpage_public'] = ['src/frontpage/index.recipe']
store_contents['profile_public'] = ['src/ilga/profile/index.recipe']
store_contents['publisher_public'] = ['src/ilga/publisher/index.recipe']

store_structure['bags']['common']['policy'] = \
    store_structure['bags']['system']['policy']

store_structure['bags']['tiddlyspace'] = {
    'desc': 'TiddlySpace client',
    'policy': store_structure['bags']['system']['policy'],
}

store_structure['recipes']['default']['recipe'].insert(1, ('tiddlyspace', ''))

store_structure['bags']['frontpage_public'] = {
    'desc': 'TiddlySpace front page',
    'policy': {
        'read': [],
        'write': ['R:ADMIN'],
        'create': ['R:ADMIN'],
        'delete': ['R:ADMIN'],
        'manage': ['R:ADMIN'],
        'accept': ['NONE'],
        'owner': 'administrator',
    },
}

store_structure['bags']['frontpage_private'] = deepcopy(
    store_structure['bags']['frontpage_public'])

store_structure['bags']['frontpage_private']['policy']['read'] = ['R:ADMIN']
store_structure['recipes']['frontpage_public'] = {
    'desc': 'TiddlySpace front page',
    'recipe': Space.CORE_RECIPE + [('frontpage_public', '')],
    'policy': {
        'read': [],
        'write': ['R:ADMIN'],
        'manage': ['R:ADMIN'],
        'delete': ['R:ADMIN'],
        'owner': 'administrator',
    },
}
store_structure['bags']['frontpage_archive'] = {
  'desc': 'TiddlySpace front page',
  'policy': store_structure['bags']['frontpage_private']['policy']
}
store_structure['recipes']['frontpage_private'] = deepcopy(
    store_structure['recipes']['frontpage_public'])
store_structure['recipes']['frontpage_private']['policy']['read'] = ['R:ADMIN']
store_structure['recipes']['frontpage_private']['recipe'].append(
    ('frontpage_private', ''))

frontpage_policy = store_structure['bags']['frontpage_public']['policy']
spaces = {
    'system-theme': 'TiddlySpace default theme',
    'system-info': 'TiddlySpace default information tiddlers',
    'system-plugins': 'TiddlySpace system plugins',
    'system-images': 'TiddlySpace default images and icons',
    'profile': 'ILGA Country Profiles for TiddlySpace',
    'publisher': 'Moderate articles for ILGA.org'
}

#  setup system space public bags and recipes
for space_name, description in spaces.items():
    space = Space(space_name)
    public_bag_name = space.public_bag()
    private_bag_name = space.private_bag()
    public_recipe_name = space.public_recipe()
    private_recipe_name = space.private_recipe()

    store_structure['bags'][public_bag_name] = {
        'desc': description,
        'policy': frontpage_policy,
    }
    store_structure['bags'][private_bag_name] = deepcopy(
        store_structure['bags'][public_bag_name])
    store_structure['bags'][private_bag_name]['policy']['read'] = ['R:ADMIN']

    store_structure['recipes'][public_recipe_name] = {
        'desc': description,
        'recipe': [
            ('system', ''),
            ('tiddlyspace', ''),
            (public_bag_name, ''),
        ],
        'policy': {
            'read': [],
            'write': ['R:ADMIN'],
            'manage': ['R:ADMIN'],
            'delete': ['R:ADMIN'],
            'owner': 'administrator',
        },
    }

    store_structure['recipes'][private_recipe_name] = deepcopy(
        store_structure['recipes'][public_recipe_name])
    store_structure['recipes'][private_recipe_name][
            'policy']['read'] = ['R:ADMIN']
    store_structure['recipes'][private_recipe_name]['recipe'].append(
        (private_bag_name, ''))

#special bags for publishing purposes
for space_name in ["published-articles-pt", "published-articles-es", "published-articles-en", "published-articles-fr"]:
  space = Space(space_name)
  public_bag_name = space.public_bag()
  archive_bag_name = "%s_archive"%(space_name)
  private_bag_name = space.private_bag()
  public_recipe_name = space.public_recipe()
  private_recipe_name = space.private_recipe()
  store_structure['bags'][public_bag_name] = {
      'desc': description,
      'policy': frontpage_policy,
  }
  store_structure['bags'][archive_bag_name] = {
      'desc': description,
      'policy': frontpage_policy,
  }
  store_structure['bags'][private_bag_name] = {
      'desc': description,
      'policy': frontpage_policy,
  }
  store_structure['recipes'][public_recipe_name] = {
      'desc': description,
      'recipe': [
          ('system', ''),
          ('tiddlyspace', ''),
          ('system-theme_public', ''),
          ('system-plugins_public', ''),
          ('system-images_public', ''),
          ('publisher_public', ''),
          (public_bag_name, 'limit=0'),
      ],
      'policy': {
          'read': [],
          'write': ['R:ADMIN'],
          'manage': ['R:ADMIN'],
          'delete': ['R:ADMIN'],
          'owner': 'administrator',
      },
  }
  store_structure['recipes'][private_recipe_name] = deepcopy(
      store_structure['recipes'][public_recipe_name])
  store_structure['recipes'][private_recipe_name]['recipe'].append(
      (private_bag_name, ''))

store_structure['bags']['MAPUSER'] = {
    'desc': 'maps extracted user credentials to canonical username',
    'policy': {
        'read': ['NONE'],
        'write': ['NONE'],
        'create': ['ANY'],
        'delete': ['NONE'],
        'manage': ['NONE'],
        'accept': ['NONE'],
        'owner': 'administrator',
    },
}

store_structure['bags']['MAPSPACE'] = {
    'desc': 'maps domain information to canonical space',
    'policy': {
        'read': ['NONE'],
        'write': ['NONE'],
        'create': ['ANY'],
        'delete': ['NONE'],
        'manage': ['NONE'],
        'accept': ['NONE'],
        'owner': 'administrator',
    },
}

#setup countries
from tiddlywebplugins.ilga.globals import COUNTRY_CODES
for code in COUNTRY_CODES:
  space = code.lower()
  description = 'country profile space for %s'%(code),
  for i in ['public', 'private', 'archive']:
    name = '%s_%s'%(space, i)
    frontpagename = 'frontpage_%s'%i
    store_structure['bags'][name] = {
      'desc': description,
      'policy': store_structure['bags'][frontpagename]['policy']
    }

  publicbag = "%s_public"%space
  privatebag = "%s_private"%space
  store_structure['recipes'][publicbag] = {
      'desc': description,
      'recipe': [
          ('system', ''),
          ('tiddlyspace', ''),
          ('system-theme_public', ''),
          ('system-plugins_public', ''),
          ('system-images_public', ''),
          ('profile_public', ''),
          (publicbag, ''),
      ],
      'policy': {
          'read': [],
          'write': ['R:ADMIN'],
          'manage': ['R:ADMIN'],
          'delete': ['R:ADMIN'],
          'owner': 'administrator',
      },
  }
  store_structure['recipes'][privatebag] = deepcopy(
      store_structure['recipes'][publicbag])
  store_structure['recipes'][privatebag]['recipe'].append(
      (privatebag, ''))
