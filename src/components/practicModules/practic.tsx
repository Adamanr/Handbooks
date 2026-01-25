import { useState, useEffect } from "react";
import {
  Clock,
  Copy,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Code,
  X,
} from "lucide-react";

export const RandomVariantButton = ({
  variants,
  onSelect,
  selectedVariant,
  onReset,
  difficulty,
}) => {
  const [hasSelected, setHasSelected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRandom = () => {
    if (hasSelected) return;
    setIsAnimating(true);

    // Анимация выбора
    let count = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * variants.length);
      onSelect(randomIndex);
      count++;

      if (count > 10) {
        clearInterval(interval);
        setIsAnimating(false);
        setHasSelected(true);
      }
    }, 100);
  };

  const handleReset = () => {
    setHasSelected(false);
    onReset();
  };

  return (
    <div
      style={{
        marginBottom: "1rem",
        display: "flex",
        gap: "0.75rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <button
        onClick={handleRandom}
        disabled={hasSelected || isAnimating}
        style={{
          padding: "0.75rem 1.5rem",
          background: hasSelected
            ? "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)"
            : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: hasSelected || isAnimating ? "not-allowed" : "pointer",
          fontWeight: "600",
          fontSize: "0.95rem",
          opacity: hasSelected ? 0.6 : 1,
          transition: "all 0.3s ease",
          boxShadow: !hasSelected
            ? "0 4px 12px rgba(59, 130, 246, 0.3)"
            : "none",
          transform: isAnimating ? "scale(0.95)" : "scale(1)",
        }}
      >
        🎲{" "}
        {isAnimating
          ? "Выбираем..."
          : hasSelected
            ? "Вариант выбран"
            : "Выбрать случайный вариант"}
      </button>

      {hasSelected && (
        <button
          onClick={handleReset}
          style={{
            padding: "0.75rem 1.25rem",
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}
        >
          <RotateCcw size={16} /> Сбросить
        </button>
      )}

      {selectedVariant !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
            borderRadius: "8px",
            color: "white",
            fontWeight: "600",
            fontSize: "0.9rem",
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
          }}
        >
          <span>
            Вариант {selectedVariant + 1} из {variants.length}
          </span>
          {difficulty && difficulty[selectedVariant] && (
            <span
              style={{
                padding: "0.25rem 0.5rem",
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "4px",
                fontSize: "0.8rem",
              }}
            >
              {difficulty[selectedVariant]}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const Timer = ({ isRunning, completedTime }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning && completedTime === null) {
      setSeconds(0);
    }
  }, [isRunning, completedTime]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const displayTime = completedTime !== null ? completedTime : seconds;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        background:
          completedTime !== null
            ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
            : isRunning
              ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
              : "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)",
        borderRadius: "8px",
        color: "white",
        fontWeight: "600",
        fontSize: "0.95rem",
        boxShadow:
          isRunning || completedTime !== null
            ? "0 2px 8px rgba(239, 68, 68, 0.3)"
            : "none",
        transition: "all 0.3s ease",
      }}
    >
      {completedTime !== null ? <Trophy size={16} /> : <Clock size={16} />}
      {formatTime(displayTime)}
    </div>
  );
};

const CodeModal = ({ code, onClose, variantNumber }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Ошибка копирования:", err);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1F2937",
          borderRadius: "12px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.5rem",
            borderBottom: "1px solid #374151",
            position: "sticky",
            top: 0,
            background: "#1F2937",
            zIndex: 1,
          }}
        >
          <h3 style={{ margin: 0, color: "#3B82F6", fontSize: "1.2rem" }}>
            Код варианта {variantNumber}
          </h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleCopy}
              style={{
                padding: "0.5rem 1rem",
                background: copySuccess ? "#10B981" : "#374151",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
                transition: "all 0.3s ease",
              }}
            >
              <Copy size={14} />
              {copySuccess ? "Скопировано!" : "Копировать"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "0.5rem",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <pre
          style={{
            margin: 0,
            padding: "1.5rem",
            color: "#1C1C1C",
            fontFamily: "monospace",
            fontSize: "0.95rem",
            lineHeight: "1.6",
            overflow: "auto",
          }}
        >
          {code}
        </pre>
      </div>
    </div>
  );
};

export const CodeBlockGo = ({ children }) => {
  return (
    <div>
      <br />
      <h2>Онлайн редактор кода для Go</h2>
      <p>
        Здесь вы можете попробовать свои силы в программировании на языке Go.
        Для этого мы предоставляем вам онлайн редактор кода, в котором вы можете
        написать свой код и запустить его.
      </p>
      <blockquote>
        <br />
        ❗️ При обновлении страницы код пропадёт, по этому, сохраните свой код
        куда-нибудь, если он важный.
      </blockquote>
      <br />
      <iframe
        src="https://codapi.org/embed/?sandbox=go&code=data%3A%3Bbase64%2CLcwxCsMwDEbhXaf4KyjYEHqOjNm6dDGpbExtOTjqVHL3YvDwxvcdYf%2BEJKghK1GuR%2BsGjtWYKH51R%2Boi5jRUwWk9a%2FL4EYARYrXH1rNadLxKKW3B%2Fby9lBeMw9M1lcG7eU6Sn62XN3u6%2Fg%3D%3D"
        width="100%"
        height="600"
      ></iframe>
    </div>
  );
};

export const CodeBlockPostgres = ({ children }) => {
  return (
    <div>
      <br />
      <h2>Онлайн редактор кода для PostgreSQL</h2>
      <p>
        Здесь вы можете попробовать свои силы в программировании на языке SQL
        для работы с PostgreSQL. Для этого мы предоставляем вам онлайн редактор
        кода, в котором вы можете написать свой код и запустить его.
      </p>
      <blockquote>
        <br />
        ❗️ При обновлении страницы код пропадёт, по этому, сохраните свой код
        куда-нибудь, если он важный.
      </blockquote>
      <br />
      <iframe
        src="https://codapi.org/embed/?sandbox=postgres&code=data%3A%3Bbase64%2CK07NSU0uUVD3SM3JyddRCM8vyklRVFdILFbITS0uTkxPtQYA"
        width="100%"
        height="600"
      ></iframe>
    </div>
  );
};

export const CodeBlockGoMongoDB = ({ children }) => {
  return (
    <div>
      <br />
      <h2>Онлайн редактор кода для MongoDB</h2>
      <p>
        Здесь вы можете попробовать свои силы в программировании на языке Go.
        Для этого мы предоставляем вам онлайн редактор кода, в котором вы можете
        написать свой код и запустить его.
      </p>
      <blockquote>
        ❗️ При обновлении страницы код пропадёт, по этому, сохраните свой код
        куда-нибудь, если он важный.
      </blockquote>
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
  difficulty,
  children,
  estimatedTime,
  taskId,
}) => {
  const storageKey = `task_${taskId || title.replace(/\s+/g, "_")}`;
  const isBrowser = typeof window !== "undefined";

  const loadFromStorage = () => {
    if (!isBrowser) return null;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Ошибка загрузки из localStorage:", e);
    }
    return null;
  };

  const savedData = loadFromStorage();

  const [selectedVariant, setSelectedVariant] = useState(
    savedData?.selectedVariant ?? null,
  );
  const [showAllVariants, setShowAllVariants] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    savedData?.isCompleted ?? false,
  );
  const [completedTime, setCompletedTime] = useState(
    savedData?.completedTime ?? null,
  );
  const [history, setHistory] = useState(savedData?.history ?? []);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [code, setCode] = useState(savedData?.currentCode ?? "");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedHistoryCode, setSelectedHistoryCode] = useState(null);

  useEffect(() => {
    let interval = null;
    if (selectedVariant !== null && !isCompleted) {
      interval = setInterval(() => {
        setCurrentSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedVariant, isCompleted]);

  useEffect(() => {
    if (!isBrowser) return;
    if (selectedVariant !== null || history.length > 0 || isCompleted || code) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            selectedVariant,
            isCompleted,
            completedTime,
            history,
            currentCode: code,
          }),
        );
      } catch (e) {
        console.error("Ошибка сохранения в localStorage:", e);
      }
    }
  }, [selectedVariant, isCompleted, completedTime, history, code, storageKey]);

  const handleSelect = (index) => {
    setSelectedVariant(index);
    setCurrentSeconds(0);
    setCode("");
  };

  const handleReset = () => {
    if (selectedVariant !== null) {
      setHistory((prev) => [
        ...prev,
        {
          variant: selectedVariant + 1,
          timestamp: new Date().toISOString(),
          completed: isCompleted,
          time: completedTime || currentSeconds,
          code: code ? code : "Код не был сохранён ☹️",
        },
      ]);
    }
    setSelectedVariant(null);
    setIsCompleted(false);
    setCompletedTime(null);
    setCurrentSeconds(0);
    setCode("");
  };

  const handleComplete = () => {
    if (!code.trim() || code.length === 0) {
      alert("Пожалуйста, сохраните код перед завершением задания!");
      return;
    }
    setIsCompleted(true);
    setCompletedTime(currentSeconds);
  };

  const handleClearProgress = () => {
    if (
      window.confirm(
        "Вы уверены, что хотите очистить весь прогресс по этому заданию?",
      )
    ) {
      setSelectedVariant(null);
      setIsCompleted(false);
      setCompletedTime(null);
      setHistory([]);
      setCurrentSeconds(0);
      setCode("");
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error("Ошибка очистки localStorage:", e);
      }
    }
  };

  const handleCopy = async () => {
    if (selectedVariant === null) return;

    const variantElement = variants[selectedVariant];
    let textToCopy = `${title}\n\nВариант ${selectedVariant + 1}\n\n`;

    if (typeof variantElement === "string") {
      textToCopy += variantElement;
    } else if (variantElement?.props?.children) {
      textToCopy += JSON.stringify(variantElement.props.children);
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Ошибка копирования:", err);
    }
  };

  const handleViewHistoryCode = (historyItem) => {
    setSelectedHistoryCode({
      code: historyItem.code,
      variant: historyItem.variant,
    });
    setShowCodeModal(true);
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`;
    }
    if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    }
    return `${secs}с`;
  };

  return (
    <div
      style={{
        border: "2px solid #E5E7EB",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem",
        background: "linear-gradient(135deg, #FAFAFA 0%, #F3F4F6 100%)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      {showCodeModal && selectedHistoryCode && (
        <CodeModal
          code={selectedHistoryCode.code}
          variantNumber={selectedHistoryCode.variant}
          onClose={() => {
            setShowCodeModal(false);
            setSelectedHistoryCode(null);
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h3
            style={{
              marginTop: 0,
              color: "#111827",
              fontSize: "1.5rem",
              fontWeight: "700",
            }}
          >
            {title}
          </h3>
          {estimatedTime && (
            <span
              style={{
                display: "inline-block",
                padding: "0.25rem 0.75rem",
                background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
                borderRadius: "6px",
                color: "white",
                fontSize: "0.85rem",
                fontWeight: "600",
                marginTop: "0.5rem",
              }}
            >
              ⏱️ Примерное время: {estimatedTime}
            </span>
          )}
        </div>
        {selectedVariant !== null && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Timer
              isRunning={selectedVariant !== null && !isCompleted}
              completedTime={completedTime}
            />
            {!isCompleted && (
              <button
                onClick={handleComplete}
                style={{
                  padding: "0.5rem 1rem",
                  background:
                    "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                }}
              >
                <CheckCircle2 size={16} /> Завершить
              </button>
            )}
          </div>
        )}
      </div>

      <p style={{ color: "#6B7280", marginBottom: "1.5rem", fontSize: "1rem" }}>
        {description}
      </p>

      <RandomVariantButton
        variants={variants}
        onSelect={handleSelect}
        selectedVariant={selectedVariant}
        onReset={handleReset}
        difficulty={difficulty}
      />

      {selectedVariant !== null && (
        <>
          <div
            style={{
              background: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
              color: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              border: "2px solid #3B82F6",
              marginTop: "1rem",
              fontFamily: "monospace",
              position: "relative",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  color: "#3B82F6",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Вариант {selectedVariant + 1}
                {isCompleted && (
                  <span
                    style={{
                      color: "#10B981",
                      fontSize: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      background: "rgba(16, 185, 129, 0.1)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "6px",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Завершено за {formatTime(completedTime)}
                  </span>
                )}
              </h4>
              <button
                onClick={handleCopy}
                style={{
                  padding: "0.5rem 1rem",
                  background: copySuccess ? "#10B981" : "#374151",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  transition: "all 0.3s ease",
                }}
              >
                <Copy size={14} />
                {copySuccess ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <div style={{ fontSize: "1rem", lineHeight: "1.6" }}>
              {variants[selectedVariant]}
            </div>
          </div>

          <div
            style={{
              marginTop: "1rem",
              padding: "1.5rem",
              background: "#FFFFFF",
              borderRadius: "12px",
              border: "2px solid #3B82F6",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Code size={20} />
                Ваш код решения
              </h4>
              <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>
                {code.length > 0
                  ? `${code.length} символов`
                  : "Код не сохранён"}
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Вставьте ваш код сюда перед завершением задания..."
              style={{
                width: "100%",
                minHeight: "200px",
                padding: "1rem",
                fontFamily: "monospace",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                resize: "vertical",
                background: "#F9FAFB",
                color: "#111827",
              }}
            />
            <p
              style={{
                marginTop: "0.75rem",
                marginBottom: 0,
                fontSize: "0.85rem",
                color: "#6B7280",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={16} />
              Код автоматически сохраняется и будет добавлен в историю при
              завершении
            </p>
          </div>
        </>
      )}

      {variants.length > 1 && (
        <div style={{ marginTop: "1.5rem" }}>
          <button
            onClick={() => setShowAllVariants(!showAllVariants)}
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              color: "#3B82F6",
              border: "2px solid #3B82F6",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.3s ease",
            }}
          >
            {showAllVariants ? <EyeOff size={16} /> : <Eye size={16} />}
            {showAllVariants
              ? "Скрыть все варианты"
              : `Показать все варианты (${variants.length})`}
          </button>

          {showAllVariants && (
            <div
              style={{
                marginTop: "1rem",
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              }}
            >
              {variants.map((variant, index) => (
                <div
                  key={index}
                  style={{
                    padding: "1rem",
                    background: "#FFFFFF",
                    border:
                      selectedVariant === index
                        ? "2px solid #3B82F6"
                        : "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontFamily: "monospace",
                    boxShadow:
                      selectedVariant === index
                        ? "0 4px 12px rgba(59, 130, 246, 0.2)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <strong style={{ color: "#111827" }}>
                      Вариант {index + 1}
                    </strong>
                    {difficulty && difficulty[index] && (
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          background: "#F3F4F6",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          color: "#6B7280",
                        }}
                      >
                        {difficulty[index]}
                      </span>
                    )}
                  </div>
                  <div style={{ color: "#6B7280" }}>{variant}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <h4 style={{ margin: 0, color: "#374151", fontSize: "1rem" }}>
              📊 История попыток
            </h4>
            <button
              onClick={handleClearProgress}
              style={{
                padding: "0.25rem 0.75rem",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: "600",
              }}
            >
              Очистить
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {history.map((item, index) => (
              <div
                key={index}
                onClick={() => handleViewHistoryCode(item)}
                style={{
                  padding: "0.6rem 0.9rem",
                  background: item.completed ? "#D1FAE5" : "#FEE2E2",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  color: "#374151",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                  border: "1px solid",
                  borderColor: item.completed ? "#A7F3D0" : "#FECACA",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.completed
                    ? "#BBF7D0"
                    : "#FECDD3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = item.completed
                    ? "#D1FAE5"
                    : "#FEE2E2";
                }}
                title="Нажмите, чтобы посмотреть код решения"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>
                    <strong>Вариант {item.variant}</strong>
                    {item.completed && " ✓"}
                  </span>
                  {item.code && item.code !== "Код не был сохранён" && (
                    <Eye size={14} color="#6B7280" />
                  )}
                </div>

                <div style={{ color: "#6B7280", fontSize: "0.82rem" }}>
                  {formatTime(item.time)} •{" "}
                  {new Date(item.timestamp).toLocaleString("ru-RU")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <br />
      {children}
    </div>
  );
};

// Демонстрация использования
export const Demo = () => {
  const demoVariants = [
    <div>
      <p>
        <strong>Задача 1:</strong> Создайте программу, которая выводит "Hello,
        World!"
      </p>
      <p>Подсказка: Используйте fmt.Println()</p>
    </div>,
    <div>
      <p>
        <strong>Задача 2:</strong> Напишите функцию, которая складывает два
        числа
      </p>
      <p>Подсказка: func add(a, b int) int</p>
    </div>,
    <div>
      <p>
        <strong>Задача 3:</strong> Создайте цикл for от 1 до 10
      </p>
      <p>Подсказка: for i := 1; i &lt;= 10; i++</p>
    </div>,
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <h1
        style={{ textAlign: "center", color: "#111827", marginBottom: "2rem" }}
      >
        🎓 Система заданий для курса
      </h1>

      <TaskWithVariants
        taskId="task-1-go-basics"
        title="Практическое задание №1: Основы Go"
        description="Выберите случайный вариант и выполните задание. Таймер поможет отследить время выполнения. Ваш прогресс сохраняется автоматически!"
        variants={demoVariants}
        difficulty={["Лёгкий", "Средний", "Лёгкий"]}
        estimatedTime="15-20 минут"
      >
        <CodeBlockGo children={undefined} />
      </TaskWithVariants>

      <div
        style={{
          padding: "1.5rem",
          background: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
          borderRadius: "12px",
          marginTop: "2rem",
          border: "2px solid #3B82F6",
        }}
      >
        <h3
          style={{
            margin: "0 0 1rem 0",
            color: "#1E40AF",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={24} />
          Новые возможности модуля
        </h3>
        <ul style={{ margin: 0, color: "#1E3A8A", lineHeight: "1.8" }}>
          <li>✨ Анимация при выборе варианта</li>
          <li>⏱️ Встроенный таймер для отслеживания времени</li>
          <li>🏆 Сохранение времени выполнения при завершении</li>
          <li>💾 Автоматическое сохранение прогресса в localStorage</li>
          <li>🔄 Кнопка сброса для выбора нового варианта</li>
          <li>📋 Копирование задания в буфер обмена</li>
          <li>👁️ Просмотр всех доступных вариантов</li>
          <li>📊 История всех попыток с временем и датой</li>
          <li>🎯 Индикаторы сложности заданий</li>
          <li>✅ Отметка о завершении задания</li>
          <li>⏱️ Указание примерного времени выполнения</li>
          <li>🗑️ Возможность очистить весь прогресс</li>
        </ul>
      </div>
    </div>
  );
};
