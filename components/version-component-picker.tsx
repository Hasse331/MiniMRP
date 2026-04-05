"use client";

import { useState } from "react";

interface PickerComponent {
  id: string;
  name: string;
  category: string;
  value: string | null;
}

export function VersionComponentPicker(props: {
  components: PickerComponent[];
}) {
  const [category, setCategory] = useState("all");

  const categories = Array.from(new Set(props.components.map((component) => component.category))).sort();

  const filteredComponents = props.components.filter((component) =>
    category === "all" ? true : component.category === category
  );

  return (
    <>
      <div className="field-group">
        <label htmlFor="version-component-category-filter">Category</label>
        <select
          id="version-component-category-filter"
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
        <label htmlFor="version-component-id">Component</label>
        <select id="version-component-id" className="select" name="component_id" defaultValue="">
          <option value="" disabled>
            Select component
          </option>
          {filteredComponents.map((component) => (
            <option key={component.id} value={component.id}>
              {component.name} - {component.category} - {component.value ?? "-"}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
