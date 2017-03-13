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
