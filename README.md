## Background
Interaction with information visualisations on mobile devices is currently limited to popular touch gestures such as tap and swipe, and this limits the tasks we can carry out on the displayed data on the one hand, and the popularity of information visualisation among non-expert users. If we could connect a wider number of actions to gestures other than tap and swipe, it would be possible to carry out a wider number of infovis tasks directly on our mobile device, whenever we need it and regardless of where we are. This would in turn contribute to increase the popularity of infovis among users.

To achieve this goal however there are a number of challenges to be addressed.

- The number of standard gestures is very low and, at the same time, it is not advisable to create brand new gestures because it would be too a big burden for the user (especially the casual user) to learn and remember.
- The tasks one can perform on an information visualisation are potentially many. Yet different users might have different needs and goals, therefore the priority rank of tasks might differ from person to person.
- To maintain a high ease of use and to increase the attractiveness of infovis for non-expert people, the mappings between gestures and actions should be consistent across different types of information visualisations.

To cope with the above challenges, infovis designers must find out which tasks to prioritise and map them to standard gestures while making sure these mappings are and stay consistent with those of other visualisations.

# sketch-a-touch
sketch-a-touch is a proof of concept that aims at helping designers to quickly set up interactive surveys to test the usability of gesture-task associations directly on mobile devices.

To allow fast prototyping and fast evaluation with potential users, sketch-a-touch extends the paper screen idea proposed by [] and proposes a paper prototype that reacts to the user input by swapping the paper views without the need for a human Wizard of Oz.

This is done by leveraging texture atlases (a.k.a. spritesheets) a popular technique employed by 2D video games to animate the characters upon user input. A spritesheet is a large image made of multiple smaller images sharing the same size, which are swapped sequentially to create the animation.

In our case, the spritesheet contains multiple views of the information visualisation and it can be connected to one or more user inputs, i.e. touch gestures, so that the user can observe how the infovis changes when they perform a specific gesture on the screen.
 
## How it works
After uploading the spritesheet containing the various views of the information visualisation, the user specifies the number or rows and columns contained by the spritesheet, so to resize the viewport to show only one image at a time.

The user can then add the interaction by drawing a circular or a rectangular interactive area on the viewport and, by selecting the gesture the area should react to, the start and end images of the animation as well as the direction in which the spritesheet should move.