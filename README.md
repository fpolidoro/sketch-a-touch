# Sketch-A-Touch Supplemental Material
Sketch-A-Touch is an Angular application for generating interacted, animated mixed-fidelity prototypes from paper sketches.

## How to run Sketch-A-Touch

This applications necessitates a web server to run properly. The most straightforward way to run it is by using a Visual Studio Code extension called Live Server by Ritwick Dey.

To run Sketch-A-Touch with VSCode:
- Launch VSCode and open the folder named sketch-a-touch provided with the supplemental material
- Switch to the VSCode Extensions tab, search Live Server and click install
- Once the installation has completed, a new button labelled "Go Live" will appear in the toolbar on the bottom-right of VSCode window
- Click Go Live to start the server, then open a browser and navigate to the following URL `localhost:5500` to access Sketch-A-Touch

### Notes
While this app theoretically does not necessitate an internet connection to run, its layout leverages Google APIs to retrieve the fonts and the icons. As such, to avoid layout artifacts due to missing icons, we recommend to ensure Google is accessible before running Sketch-A-Touch.

Being a proof-of-concept, we did not perform an in-depth testing of the interface widgets. Despite we tried to fix as many bugs and glitches as possible, this version of Sketch-A-Touch still has few bugs that might affect the correct display of sprite-sheet images and the animation previewer (when more than one interactive area is present).

As stated in the paper, the automatic code generation for the gestures is not fully implemented. Tap is the only gesture currently supported (although not tested extensively). To deploy the prototypes featuring the tap gesture, it is necessary to manually change the file name associated to the `background-image` property within the `#anim` block of the generated CSS file with the file name (or location) of the actual image file.
