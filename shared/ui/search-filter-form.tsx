export function SearchFilterForm(props: {
  defaultSearch?: string;
  defaultCategory?: string;
  searchPlaceholder: string;
  categoryPlaceholder?: string;
  submitLabel?: string;
}) {
  return (
    <form>
      <input
        className="input"
        type="text"
        name="search"
        placeholder={props.searchPlaceholder}
        defaultValue={props.defaultSearch ?? ""}
      />
      <input
        className="input"
        type="text"
        name="category"
        placeholder={props.categoryPlaceholder ?? "Category"}
        defaultValue={props.defaultCategory ?? ""}
      />
      <button className="button subtle" type="submit">
        {props.submitLabel ?? "Apply filters"}
      </button>
    </form>
  );
}
