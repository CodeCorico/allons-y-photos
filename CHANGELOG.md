<a name="1.0.15"></a>
# [1.0.15](https://github.com/CodeCorico/allons-y-photos/compare/1.0.14...1.0.15) (2017-03-27)

### Bug Fixes
* **indexer env:** remove INDEXER_RECEIVER default [#d7a25ba](https://github.com/CodeCorico/allons-y-photos/commit/d7a25ba)
* **indexer:** crash when finding new photos [#1770387](https://github.com/CodeCorico/allons-y-photos/commit/1770387)
* **indexer:** crash at the end of the indexing [#da4a47f](https://github.com/CodeCorico/allons-y-photos/commit/da4a47f)

<a name="1.0.14"></a>
# [1.0.14](https://github.com/CodeCorico/allons-y-photos/compare/1.0.13...1.0.14) (2017-03-26)

### Features
* **indexer:** remove deleted photos from database [#2472118](https://github.com/CodeCorico/allons-y-photos/commit/2472118)
* **indexer:** wait for end of indexation before restart it [#d6c498b](https://github.com/CodeCorico/allons-y-photos/commit/d6c498b)
* **indexer:** add the possibility to wath a path and move new photos to the indexer default path [#5a91a1f](https://github.com/CodeCorico/allons-y-photos/commit/5a91a1f)

### Bug Fixes
* **photos viewer:** display download button on mobile view [#a36acd7](https://github.com/CodeCorico/allons-y-photos/commit/a36acd7)

<a name="1.0.13"></a>
# [1.0.13](https://github.com/CodeCorico/allons-y-photos/compare/1.0.12...1.0.13) (2017-03-23)

### Bug Fixes
* **indexer:** check for vertical videos before compress them [#9a4afae](https://github.com/CodeCorico/allons-y-photos/commit/9a4afae)

<a name="1.0.12"></a>
# [1.0.12](https://github.com/CodeCorico/allons-y-photos/compare/1.0.11...1.0.12) (2017-03-22)

### Features
* **indexer:** register the video compressed to be viewed [#1fb51fb](https://github.com/CodeCorico/allons-y-photos/commit/1fb51fb)
* **photos viewer:** display the video compressed [#cf627e6](https://github.com/CodeCorico/allons-y-photos/commit/cf627e6)
* **indexer:** output info when the indexer is ready [#3ec3299](https://github.com/CodeCorico/allons-y-photos/commit/3ec3299)

<a name="1.0.11"></a>
# [1.0.11](https://github.com/CodeCorico/allons-y-photos/compare/1.0.10...1.0.11) (2017-03-22)

### Features
* **indexer:** compress videos to 720p [#501e3cb](https://github.com/CodeCorico/allons-y-photos/commit/501e3cb)

### Bug Fixes
* **photos layout:** use isPart in filtered views [#1825d31](https://github.com/CodeCorico/allons-y-photos/commit/1825d31)

### Performance Improvements
* **indexer:** get the database photos at start instead of for every photo iteration [#6ce7a7f](https://github.com/CodeCorico/allons-y-photos/commit/6ce7a7f)

<a name="1.0.10"></a>
# [1.0.10](https://github.com/CodeCorico/allons-y-photos/compare/1.0.9...1.0.10) (2017-03-19)

### Features
* **indexer:** add the env option to index videos [#23ea4e5](https://github.com/CodeCorico/allons-y-photos/commit/23ea4e5)
* **indexer:** add the env option to index at start [#2d0807d](https://github.com/CodeCorico/allons-y-photos/commit/2d0807d)

<a name="1.0.9"></a>
# [1.0.9](https://github.com/CodeCorico/allons-y-photos/compare/1.0.8...1.0.9) (2017-03-19)

### Features
* **photos layout:** add people/moments tooltips [#f2556c1](https://github.com/CodeCorico/allons-y-photos/commit/f2556c1)
* **photos layout:** add people/moments loading on change [#cc55dc8](https://github.com/CodeCorico/allons-y-photos/commit/cc55dc8)
* **photos:** can hide/show with the new photos-hidden permission [#4ce8179](https://github.com/CodeCorico/allons-y-photos/commit/4ce8179)

<a name="1.0.8"></a>
# [1.0.8](https://github.com/CodeCorico/allons-y-photos/compare/1.0.7...1.0.8) (2017-03-16)

### Bug Fixes
* **photos layout:** display modulo empty photos if the first date is a part [#f88bc1b](https://github.com/CodeCorico/allons-y-photos/commit/f88bc1b)

<a name="1.0.7"></a>
# [1.0.7](https://github.com/CodeCorico/allons-y-photos/compare/1.0.6...1.0.7) (2017-03-16)

### Bug Fixes
* **photos nav:** move the Moments before the People section [#d41f221](https://github.com/CodeCorico/allons-y-photos/commit/d41f221)

### Performance Improvements
* **indexer:** create smaller covers [#1cbade4](https://github.com/CodeCorico/allons-y-photos/commit/1cbade4)
* **photos layout:** remove the select mode photos animations [#96c7270](https://github.com/CodeCorico/allons-y-photos/commit/96c7270)
* **photos layout:** split the dates to load to every 25 photos [#f292fc9](https://github.com/CodeCorico/allons-y-photos/commit/f292fc9)

<a name="1.0.6"></a>
# [1.0.6](https://github.com/CodeCorico/allons-y-photos/compare/1.0.5...1.0.6) (2017-03-13)

### Features
* **photos layout:** display moments count on select mode [#c70ea87](https://github.com/CodeCorico/allons-y-photos/commit/c70ea87)
* **indexer:** clear photos cash at the end of the indexer process [#e77ba6d](https://github.com/CodeCorico/allons-y-photos/commit/e77ba6d)

### Bug Fixes
* **photos photo model:** sort by shotTime then by source [#8a77de9](https://github.com/CodeCorico/allons-y-photos/commit/8a77de9)

### Performance Improvements
* **photos photo model:** cache photos on first call [#c231874](https://github.com/CodeCorico/allons-y-photos/commit/c231874)
* **photos photo model:** select only id and cover when update photos [#91e0b13](https://github.com/CodeCorico/allons-y-photos/commit/91e0b13)

<a name="1.0.5"></a>
# [1.0.5](https://github.com/CodeCorico/allons-y-photos/compare/1.0.4...1.0.5) (2017-03-05)

### Features
* **indexer:** log error on .mov convertion [#505f043](https://github.com/CodeCorico/allons-y-photos/commit/505f043)

### Bug Fixes
* **photos photo model:** people and moments names don't differt on different case formating [#9afed17](https://github.com/CodeCorico/allons-y-photos/commit/9afed17)
* **indexer env:** use a confirm input for the convertion question [#1cde7b2](https://github.com/CodeCorico/allons-y-photos/commit/1cde7b2)
* **photos layout:** selection indexes don't changes when scrolling [#76b07bf](https://github.com/CodeCorico/allons-y-photos/commit/76b07bf)
* **photos viewer:** remove the play button [#b8b3bd5](https://github.com/CodeCorico/allons-y-photos/commit/b8b3bd5)
* **photos viewer:** disable download bar on video [#6dbad64](https://github.com/CodeCorico/allons-y-photos/commit/6dbad64)

### Performance Improvements
* **photos photo model:** query the callPhotos 30% faster [#00c6000](https://github.com/CodeCorico/allons-y-photos/commit/00c6000)

<a name="1.0.4"></a>
# [1.0.4](https://github.com/CodeCorico/allons-y-photos/compare/1.0.3...1.0.4) (2017-03-01)

### Features
* **indexer:** convert .mov files to .mp4 [#8e87621](https://github.com/CodeCorico/allons-y-photos/commit/8e87621)

<a name="1.0.3"></a>
# [1.0.3](https://github.com/CodeCorico/allons-y-photos/compare/1.0.2...1.0.3) (2017-03-01)

### Features
* **indexer:** log every error in a logs file [#696e1cd](https://github.com/CodeCorico/allons-y-photos/commit/696e1cd)

<a name="1.0.2"></a>
# [1.0.2](https://github.com/CodeCorico/allons-y-photos/compare/1.0.1...1.0.2) (2017-02-26)

### Features
* **indexer:** sort the indexer files by most recent first [#03ce85d](https://github.com/CodeCorico/allons-y-photos/commit/03ce85d)
* **indexer:** add "updated" and "added" log details [#5728daf](https://github.com/CodeCorico/allons-y-photos/commit/5728daf)

### Bug Fixes
* **indexer env:** remove useless watcher option [#252830e](https://github.com/CodeCorico/allons-y-photos/commit/252830e)
* **indexer:** remove "File Modification Date/Time" exif check [#5153307](https://github.com/CodeCorico/allons-y-photos/commit/5153307)

<a name="1.0.1"></a>
# [1.0.1](https://github.com/CodeCorico/allons-y-photos/compare/1.0.0...1.0.1) (2017-02-26)

### Bug Fixes
* **indexer:** get the "File Modification Date/Time" exif for photo date [#5f1d448](https://github.com/CodeCorico/allons-y-photos/commit/5f1d448)

<a name="1.0.0"></a>
# [1.0.0 Allonzo](https://github.com/CodeCorico/allons-y-photos/releases/tag/1.0.0) (2017-02-25)

### Features

* **indexer:** First version
* **photos:** First version
