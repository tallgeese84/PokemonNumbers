# Retiring the old Poké Reading app

Copy `index.html` and `sw.js` from this folder over the files in the
`PokemonReading` repository (leave the icons). Tablets that open the old icon
get the new page on their next online visit, drop the old offline copy, and
land in PokéMath, which imports the old app's caught Pokémon and uses the
recorded sounds (same site, same storage). Nothing in local storage is deleted.

Optionally replace the home-screen icon with PokéMath's.
