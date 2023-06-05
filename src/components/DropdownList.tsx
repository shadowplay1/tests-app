import { useState } from 'react'
import { Optional } from '@/lib/misc/utilityTypes'

function DropdownList({
    options,
    initialOptionText,
    initialSelectionIndex,
    className,
    getSelectedIndex,
    onSelect,
    selectedOption
}: IDropdownListProps): JSX.Element {
    const [selectedValue, setSelectedValue] = useState<string | number | null>(
        initialSelectionIndex || null
    )

    const handleSelectChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ): void => {
        setSelectedValue(
            getSelectedIndex ? event.target.selectedIndex - 1 : event.target.value
        )
    }

    if (onSelect && selectedValue !== null) {
        onSelect(selectedValue)
    }

    return (
        <select value={selectedOption ?? ''} className={className} onChange={handleSelectChange}>
            <option>{initialOptionText || 'Выберите вариант'}</option>

            {options.map((option, optionIndex) => (
                <option
                    value={option.value || ''}
                    key={optionIndex}
                    selected={option.value === selectedOption}
                >
                    {option.text || option.value}
                </option>
            ))}
        </select>
    )
}

export default DropdownList

interface IDropdownListProps {
    options: Optional<Record<'text' | 'value', string>, 'value'>[]
    initialOptionText?: string
    initialSelectionIndex?: number
    className?: string
    getSelectedIndex?: boolean
    onSelect?: (selectedValue: string | number) => void
    selectedOption?: string | number
}
