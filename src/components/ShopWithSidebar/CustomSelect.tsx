import React, { useState, useEffect, useRef, useCallback } from 'react'

const CustomSelect = ({
  options,
  onChange,
}: {
  options: any[]
  onChange: (value: any) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(options[0])
  const selectRef = useRef<any>(null)

  // Function to close the dropdown when a click occurs outside the component
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (selectRef.current && event.target && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    // Add a click event listener to the document
    document.addEventListener('click', handleClickOutside)

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [handleClickOutside])

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleOptionClick = useCallback(
    (option: any) => {
      setSelectedOption(option)
      setIsOpen(false)
      // Call onChange if it's defined
      if (onChange) {
        onChange(option.value)
      }
    },
    [onChange]
  )

  return (
    <div className='custom-select custom-select-2 flex-shrink-0 relative' ref={selectRef}>
      <div
        className={`select-selected whitespace-nowrap ${isOpen ? 'select-arrow-active' : ''}`}
        onClick={toggleDropdown}
      >
        {selectedOption.label}
      </div>
      <div className={`select-items ${isOpen ? '' : 'select-hide'}`}>
        {options.slice(1).map((option, index) => (
          <div
            key={index}
            onClick={() => handleOptionClick(option)}
            className={`select-item ${selectedOption === option ? 'same-as-selected' : ''}`}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CustomSelect
