# ewuit
means => an easy web ui inspect tool

| demo | other App1 |
| ---- | ---------- |

## QuickStart
append this code in your html template
```html
<script>
(function () {
    var url = '//unpkg.com/ewuit@latest/dist/index.min.js'
    var script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
    script.onload = function () { 
        const ewuit = new Ewuit()
        // open a ui tool
        ewuit.openUI()
    }
})();
</script>
```
## Installed
### CDN
add script in html template
```html
<script src="https://unpkg.com/ewuit@latest/dist/index.min.js"></script>
<script>
const Ewuit = window.Ewuit
</script>
```

### NPM
```sh
# npm
npm i ewuit

# yarn
yarn add ewuit

# pnpm
pnpm add ewuit
```

```ts
import Ewuit from 'ewuit'
```

## Usage
### UI
```js
const ewuit = new Ewuit()

// open a ui tool
ewuit.openUI()
// close a ui tool
ewuit.closeUI()
```

### API
You can use these apis instead of UI action panels
```js
const ewuit = new Ewuit()

ewuit.call('attribute',true)
ewuit.call('distance',true)
```

### Options
## TODO

* [x] Check Element Attribute
* [x] Check Element Distance
* [ ] Support More DIY Feature
