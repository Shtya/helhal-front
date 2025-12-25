const CountryFlag = ({ countryCode }) => {
    // Use the 2-letter code (e.g., 'BV') to get an SVG
    return (
        <img
            alt={countryCode}
            src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`}
            className="w-5 h-auto mr-1 inline-block"
        />
    )
}

export default CountryFlag;