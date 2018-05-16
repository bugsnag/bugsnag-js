@package_json_glob_path = File.join(__dir__, '..', 'fixtures', '*', '*', 'package.json')

def get_package_jsons_for_fixtures
  # only pick up package.json files for our fixture projects, not the installed node_modules
  Dir.glob(File.expand_path(@package_json_glob_path)).select { |pkg| !pkg.include? 'node_modules' }
end
