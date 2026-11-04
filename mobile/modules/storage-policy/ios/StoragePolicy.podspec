Pod::Spec.new do |s|
  s.name = 'StoragePolicy'
  s.version = '1.0.0'
  s.summary = 'Family Hub private platform storage module'
  s.description = s.summary
  s.license = { :type => 'Private' }
  s.author = 'Family Hub'
  s.homepage = 'https://example.invalid/familyhub'
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
