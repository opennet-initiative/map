from setuptools import setup
import os

from on_map import VERSION


# Module entsprechend PEP420 (ohne "__init__.py") werden von setuptools.find_packages nicht erkannt
# siehe https://bitbucket.org/pypa/setuptools/issues/97
def get_package_list(path):
    return [item[0].replace(os.path.sep, ".") for item in os.walk(path)
            if "__pycache__" not in item[0]]


# parse dependencies from requirements.txt
def get_requirements():
    with open('requirements.txt') as f:
        required = [line for line in f.read().splitlines() if line.strip() and "#" not in line]
        return required


setup(
    name="on_map",
    # "rc1.dev1254" may be added via environment
    version=VERSION + os.environ.get("RELEASE_SUFFIX", ""),
    description="Map visualization for a mesh network",
    url="ssh://git@dev.on-i.de:on_map.git",
    author="Lars Kruse",
    author_email="devel@sumpfralle.de",
    classifiers=[
        "Programming Language :: Python :: 3",
    ],
    packages=get_package_list("on_map"),
    install_requires=get_requirements(),
    extras_require={},
    entry_points={
        "console_scripts": [
            "on-map=on_map.server:main_func",
        ],
    },
)
