"use client";

import { useState } from "react";

interface PickerPart {
  id: string;
  name: string;
  category: string;
  value: string | null;
}

export function PartPicker(props: {
  parts: PickerPart[];
}) {
  const [category, setCategory] = useState("all");

  const categories = Array.from(new Set(props.parts.map((part) => part.category))).sort();
  const filteredParts = props.parts.filter((part) =>
    category === "all" ? true : part.category === category
  );

  return (
    <>
      <div className="field-group">
        <label htmlFor="version-part-category-filter">Category</label>
        <select
          id="version-part-category-filter"
          className="select"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="version-part-id">Component</label>
        <select id="version-part-id" className="select" name="component_id" defaultValue="">
          <option value="" disabled>
            Select component
          </option>
          {filteredParts.map((part) => (
            <option key={part.id} value={part.id}>
              {part.name} - {part.category} - {part.value ?? "-"}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
