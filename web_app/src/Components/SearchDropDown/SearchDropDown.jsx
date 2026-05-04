import AsyncSelect from "react-select/async";

// 1. Tell it how to fetch the data
const loadOptions = async (inputValue) => {
  if (!inputValue) return [];
  const response = await fetch(
    `http://localhost:3000/songs/search?q=${inputValue}`,
  );
  const data = await response.json();

  // react-select requires data to have 'value' and 'label' properties
  return data.map((song) => ({
    value: song,
    label: song.title,
  }));
};

// 2. Overwrite the default text to include the image
const CustomOption = ({ innerProps, data }) => (
  <div {...innerProps} className="my-custom-dropdown-item">
    <img src={data.value.thumbnail} />
    <div>
      <b>{data.value.title}</b>
      <p>{data.value.artists}</p>
    </div>
  </div>
);

// 3. Render it!
return (
  <AsyncSelect
    loadOptions={loadOptions}
    components={{ Option: CustomOption }}
    onChange={(selectedItem) => handleSelectSong(selectedItem.value)}
  />
);
