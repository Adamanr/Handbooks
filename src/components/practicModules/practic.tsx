import { useState } from "react";

export const RandomVariantButton = ({
  variants,
  onSelect,
  selectedVariant,
}) => {
  const [hasSelected, setHasSelected] = useState(false);

  const handleRandom = () => {
    if (hasSelected) return;
    const randomIndex = Math.floor(Math.random() * variants.length);
    onSelect(randomIndex);
    setHasSelected(true);
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <button
        onClick={handleRandom}
        disabled={hasSelected}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: hasSelected ? "#555" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: hasSelected ? "not-allowed" : "pointer",
          fontWeight: "500",
          fontSize: "0.95rem",
          opacity: hasSelected ? 0.6 : 1,
        }}
      >
        🎲 {hasSelected ? "Вариант уже выбран" : "Выбрать случайный вариант"}
      </button>
      {selectedVariant !== null && (
        <span
          style={{ marginLeft: "1rem", color: "#0070f3", fontWeight: "500" }}
        >
          Выбран вариант {selectedVariant + 1} из {variants.length}
        </span>
      )}
    </div>
  );
};

export const CodeBlock = ({ children }) => {
  return (
    <div>
      <br />
      <iframe
        src="https://codapi.org/embed/?sandbox=go&code=data%3A%3Bbase64%2CLcwxCsMwDEbhXaf4KyjYEHqOjNm6dDGpbExtOTjqVHL3YvDwxvcdYf%2BEJKghK1GuR%2BsGjtWYKH51R%2Boi5jRUwWk9a%2FL4EYARYrXH1rNadLxKKW3B%2Fby9lBeMw9M1lcG7eU6Sn62XN3u6%2Fg%3D%3D"
        width="100%"
        height="600"
      ></iframe>
    </div>
  );
};

export const TaskWithVariants = ({
  title,
  description,
  variants,
  children,
}) => {
  const [selectedVariant, setSelectedVariant] = useState(null);

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "2rem",
        backgroundColor: "#fafafa",
      }}
    >
      <h3 style={{ marginTop: 0, color: "black" }}>{title}</h3>
      <p style={{ color: "#555" }}>{description}</p>
      <RandomVariantButton
        variants={variants}
        onSelect={setSelectedVariant}
        selectedVariant={selectedVariant}
      />
      {selectedVariant !== null && (
        <div
          style={{
            backgroundColor: "black",
            color: "#fff",
            padding: "1.5rem",
            borderRadius: "6px",
            border: "2px solid #0070f3",
            marginTop: "1rem",
            fontFamily: "monospace",
          }}
        >
          <h4 style={{ marginTop: 0, color: "#0070f3" }}>
            Вариантㅤ{selectedVariant + 1}
          </h4>
          {variants[selectedVariant]}
        </div>
      )}
      <br />
      {children}
    </div>
  );
};
