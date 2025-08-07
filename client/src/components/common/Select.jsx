import { PiCaretDownBold } from "react-icons/pi"

function Select({ onChange, value, options, title }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {title && (
        <label htmlFor={`select-${title}`} className="text-sm text-gray-300 font-medium">
          {title}
        </label>
      )}
      <div className="relative">
        <select
          id={`select-${title}`}
          className="w-full appearance-none rounded-md border-none bg-darkHover px-4 py-2 pr-10 text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={value}
          onChange={onChange}
          aria-label={title}
        >
          {options.map((option, index) => {
            const optionValue = option
            // Capitalize first letter only if option is string and lowercase
            const optionName =
              typeof option === "string" && option.length > 0
                ? option.charAt(0).toUpperCase() + option.slice(1)
                : option

            return (
              <option
                key={index}
                value={optionValue}
                className="bg-darkHover text-white"
              >
                {optionName}
              </option>
            )
          })}
        </select>
        <PiCaretDownBold
          size={16}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export default Select
