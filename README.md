# Presenter

Presenter is a virtual laser pointer that makes it possible to use a web app on
your phone to steer a "laser" dot on a web page on your computer. Just point
your phone in a direction and the dot will follow. It could be used as a virtual
presenter/remote during presentations. Possible future functionality include
switching between slides and setting a timer.

This is so far mostly an experiment. However, it actually works, albeit the
"laser" dot can jerk a bit if you move it too fast.

## How does it work?

It has two parts, a web extension for your browser and a web app that will run
on you phone. The web extension will initiate an
[RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection),
then it shows a QR code that the phone can scan. The link in the QR code leads
to a web app with a specified session ID to be used for the pairing.

When the pairing is done, the web app on the phone will show a UI with a large
button. When holding down the button, the app starts sending device orientation
values to the web extension which calculates a position for the red dot and
paints it on the web page.

## Requirements

The web extension has been tested in newer Firefox and Chrome versions. The web
app has been tested with newer versions of Firefox and Chrome on Android, and
Safari on Iphone.

## How to set up

### Install

```bash
git clone git@github.com:mattiasw/presenter.git
cd presenter
npm install
```

### Build

```bash
npm run build # Build the web app.
npm run build:extension # Build the web extension.
```

The built files are put in the `dist` folder.

### Configure

Copy and fill in the fields in the config file:

```bash
cp config.json.sample config.json
```

The `app-host` field is where you have put the web app (use `npm run watch` to
launch a local web server). You have to set a STUN server for the pairing. There
are some open ones, just do a web search. Then there are the
[Firebase](https://firebase.google.com/) fields since this solution uses
[Firestore](https://firebase.google.com/docs/firestore/) during the offer/answer
negotiation between the extension and the app. If you want, the Firebase part is
contained in its own module and should be easy to replace (depending on your
definition of "easy").

### Install web extension

This is different between browsers. If the extension is not signed (which it is
not when we make our own like this), you have to enable the developer mode to be
able to install it. Do a web search for how to do it in your specific browser.
It's not that tricky. Then go to the extension settings page and add it,
possibly using debug mode.

## Using

When the setup is done, go to a web page and click the new icon in your web
browser. A QR code should show in the bottom right corner. Scan it with your
phone and open the link in your mobile browser. If you have the web app set up
locally you will probably need to bypass the security questions about a faulty
certificate. After that you should see the UI. When the pulsating button has
turned into a bluish color, hold it down to show the red "laser" dot on the
other screen. Rotate your phone around the X axis or Y axis to move the dot.

A tip is to lock your phone's screen orientation to not accidently rotate it
while moving the dot.

### Calibrating

There are starting values for how fast the dot should move, but they will
probably not fit your specific size of the screen and/or your distance from it.
Therefore it's possible to do a calibration. Just hold down the small
calibration button in the web app and slowly point your phone to all four edges
of the screen. After releasing the calibrate button, the dot should follow your
movements better.

## Troubleshooting

As the web extension is set up right now, it will not work on web pages with a
strict Content Security Policy (CSP). E.g., on <https://www.npmjs.com/> the CSP
will prevent Firebase from initializing correctly. There may be a way around
this but I have not looked into it yet (maybe it could be moved into
`content.js` or even `background.js`).

## Attribution

Icons are made by Vectors Market from the Noun Project, CC BY 3.0,
<https://thenounproject.com/term/laser/233794/>.
