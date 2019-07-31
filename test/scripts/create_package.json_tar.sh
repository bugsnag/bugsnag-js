#!

rm -f min_packages.tar

find packages/** -maxdepth 2 -type f \( -name package.json -or -name package-lock.json \) | tar --mtime='1970-01-01' -cf - -T - | gzip --no-name > min_packages.tar