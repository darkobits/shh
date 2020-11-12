<a href="#top" id="top">
  <img src="https://user-images.githubusercontent.com/441546/98890197-45aecf80-2450-11eb-91da-8362a5a1f1bc.png" style="max-width: 100%;">
</a>
<p align="center">
  <a href="https://www.npmjs.com/package/@darkobits/shh"><img src="https://img.shields.io/npm/v/@darkobits/shh.svg?style=flat-square"></a>
  <a href="https://github.com/darkobits/shh/actions"><img src="https://img.shields.io/endpoint?url=https://aws.frontlawn.net/ga-shields/darkobits/shh&style=flat-square"></a>
  <a href="https://david-dm.org/darkobits/shh"><img src="https://img.shields.io/david/darkobits/shh.svg?style=flat-square"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/conventional%20commits-1.0.0-FB5E85.svg?style=flat-square"></a>
</p>

Command line utility for quickly sharing information of nominal sensitivity with others when chat clients, e-mail, or other mediums are not suitable.

## Install

```
npm i -g @darkobits/shh
```

## Use

This utility will start an HTTP server on a random port that will only respond to requests at a random path and that, by default, will automatically shut-down after 1 minute **or** after the first request is served.

To share a string using the default options:

```
shh unicorns
```

Will produce a link like:

```
http://10.2.3.4:60912/968524719da14def8fa2eb8ce8fc300e
```

To serve the contents of a local file:

```
shh -f unicorns.txt
```

To keep the server running after the first request (not recommended):

```
shh unicorns --no-stop
```

To adjust the shut-down timeout (not recommended):

```
shh unicorns -t 5m
```

By default, information will only be available to other machines on your local network. If you need to share information with someone via the public Internet, pass the `-p` flag:

```
shh unicorns -p
```

This will create a secure tunnel using [`ngrok`](https://ngrok.com/) with TLS support:

```
https://50f1751b.ngrok.io/dec57204675841c2903094e65d126341
```

<a href="#top">
  <img src="https://user-images.githubusercontent.com/441546/69777002-41ac7380-1153-11ea-85a4-88184f8c9975.png" style="max-width: 100%;">
</a>
