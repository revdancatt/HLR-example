# HLR-example

A quick "stress test" for the new Hidden Line Removal feature of the AxiDraw tools.

This code is so I can quickly create 5,000+ overlapping rectangles, which can then be used to test the HLR option in the AxiDraw InkScape extension, CLI and Python.

![plots](https://gateway.fxhash2.xyz/ipfs/QmcnapdnfgGt5w7vJPDVnAb7BhKAGeGhKucNKxR4yFuMUn)

## Installation

Clone the github repository into a folder, then open `index.html` in a browser.

The project has been designed to work on [fxhash](https://www.fxhash.xyz/) with [fx(params)](https://www.fxhash.xyz/doc/artist/params), to do this first install [fx(lens)](https://www.fxhash.xyz/doc/artist/fxlens) and follow those instructions on the [fxlens GitHub page](https://github.com/fxhash/fxlens#inspect-token-with-fxlens), section: "Inspect token with fx(lens)"

## Usage

If running the code locally, adjust the settings on the left until you have the desired results, then press 1-6 to download an SVG formatted to A1 to A6 in size.

Then run that through the Hidden Line Removal tool to see how long the tool takes on your system.

## Outputs and the Hidden Line Removal.

If you're running locally, then pressing 1-6 will give you an SVG file you can process. Alternatively you can view the project running on fxhash here: https://www.fxhash.xyz/generative/slug/hidden-line-removal-test-demo-copy/explore-params

On that page set your parameters how you'd like, in my tests 5,000 "squares" takes about 8 minutes to remove the hidden lines, 10,000 is about half an hour, MacBook Pro 2020 M1 Chip.

![Params](https://gateway.fxhash2.xyz/ipfs/QmSg7RJAka8b49FyreDa6guHvyBg1VxJanMZDKa5xMekEM)

Once you have your params set hit the "Open in New Window" icon in the bottom left hand corner to open the artwork in a way that allow it to receive key presses.

![Open in new window](https://gateway.fxhash2.xyz/ipfs/QmV57ygbGRdrDCz8RFta3Gbv9Cz83xp6rscg6nsf1jVNMC)

Either way, once you have your SVG file, open in InkScape, then select "Save a Copy...", pick AxiDraw "Plob" Plot Digest as the output...

![Plob](https://gateway.fxhash2.xyz/ipfs/QmdtizaC5QbxVjwb65ZwLnGFA2FN1UDDXVVa3S2398eRA2)

...then select the target AxiDraw size, turn Hidden-line removal on in the dialog that pops up, and optionally optimisation...

![Dialog](https://gateway.fxhash2.xyz/ipfs/QmQwgShvca9LhHETcsXbAbpYrfD1XJxRT8odtCiLX1WVUM)

Click OK will kick off the removal which can take anywhere from seconds to hours?? Depending on how complex everything is.

Once it's finished it'll create an SVG file that you can then send directly to the pen plotter.

## More information

You can read more details here: https://www.fxhash.xyz/article/editor/1241/preview  
View the YouTube video here: https://www.youtube.com/watch?v=uNJcdEW1vpY

![Single plot](https://gateway.fxhash2.xyz/ipfs/QmNY8T3oeftGDgETafQy4vHDnfuqpu6H5G1AUw1AWgQDhy)
