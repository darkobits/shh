<a href="#top" id="top">
  <img src="https://user-images.githubusercontent.com/441546/55774650-e81ff900-5a4a-11e9-833d-b28a482bed88.png" style="max-width: 100%;">
</a>
<p align="center">
  <a href="https://www.npmjs.com/package/@darkobits/shh"><img src="https://img.shields.io/npm/v/@darkobits/shh.svg?style=flat-square"></a>
  <a href="https://travis-ci.org/darkobits/shh"><img src="https://img.shields.io/travis/darkobits/shh.svg?style=flat-square"></a>
  <a href="https://david-dm.org/darkobits/shh"><img src="https://img.shields.io/david/darkobits/shh.svg?style=flat-square"></a>
  <a href="https://github.com/conventional-changelog/standard-version"><img src="https://img.shields.io/badge/conventional%20commits-1.0.0-027dc6.svg?style=flat-square"></a>
  <a href="https://github.com/sindresorhus/xo"><img src="https://img.shields.io/badge/code_style-XO-e271a5.svg?style=flat-square"></a>
</p>

Command line utility for quickly sharing information of nominal sensitivity with others.

## Install

```
npm i -g @darkobits/shh
```

## Use

This utility will start an HTTP server that, by default, will automatically shut-down after 1 minute **or** after the first request is served.

Run with default options:

```
shh "unicorns"
```

Serve the contents of a local file:

```
shh -f unicorns.txt
```

Keep the server running after the first request (not recommended):

```
shh "unicorns" --no-stop
```

Adjust the shut-down timeout:

```
shh "unicorns" -t 5m
```

By default, information will only be available to other machines on your local network. If you need to share information with someone via the public Internet, pass the `-p` flag:

```
shh "unicorns" -p
```

This will create a secure tunnel using [`ngrok`](https://ngrok.com/) with TLS support.

## &nbsp;
<p align="center">
  <br>
  <img width="22" height="22" src="https://cloud.githubusercontent.com/assets/441546/25318539/db2f4cf2-2845-11e7-8e10-ef97d91cd538.png">
</p>
