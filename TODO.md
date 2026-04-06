- Add new page: prduction where you list:
  - List of products and versions and qty under production, longest leadtime and MRP export
  - When you click open you can open the MRP calculation what has been made previously.

- On version page MRP replace Update inventory with "add to production" and remove export MRP button, since it is moved to production page when adding to production and export will be moved to production page.

- on purchasing page: remove diplicates from near safety and current shortages. If component is on current shortages, don't display it also on near safety stock at the same time, since it is obvious. Purhacsing page is calculating sum of all needed MRP listed components in the production page -> user can export one purchasing CSV or view all of them. Later when user adds the components to inventory shortages are removed from purchasing page automatically.
- Calculate current shortages: recommended order by calculating products in production net need. Shortage recommended order is sum of all production net needs + each component safety stock.
- Add component to "Near safety stock" when current inventory is more than 0 and less than 1.5x safety stock

- Add seller link to purchasing "current shortages" rows, and edit button to edit link quickly
