#!

rm -f min_packages.tar

find packages/** -type f \( -name package.json -or -name package-lock.json \) -maxdepth 2 | tar cf - -T - | gzip --no-name > min_packages.tar