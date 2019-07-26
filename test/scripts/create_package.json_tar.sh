#!

rm -f min_packages.tar
mkdir -p min_packages

cd packages
for dir in */
do
  mkdir ../min_packages/$dir
  cp $dir/package.json $dir/package-lock.json ../min_packages/$dir/
done

cd ../min_packages

tar -cf ../min_packages.tar *

cd ..
rm -rf min_packages