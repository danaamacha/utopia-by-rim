// frontend/src/pages/admin/AdminProductList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBreakpoint from "../../hooks/useBreakpoint";
import {
  readAdminState,
  writeAdminState,
  buildMergedProducts,
} from "./adminProductsUtils";

export default function AdminProductList() {
  const bp = useBreakpoint();
  const isMobile = bp.xs || bp.sm;
  const nav = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all"); // all | specific cat
  const [status, setStatus] = useState("all"); // all | instock | soldout
  const [adminState, setAdminState] = useState({});

  useEffect(() => {
    setAdminState(readAdminState());
  }, []);

  const mergedProducts = useMemo(
    () => buildMergedProducts(adminState),
    [adminState]
  );

  const categories = useMemo(() => {
    const set = new Set();
    mergedProducts.forEach((p) => p.cat && set.add(p.cat));
    return Array.from(set);
  }, [mergedProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return mergedProducts.filter((p) => {
      const matchText =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.short && p.short.toLowerCase().includes(q));

      const matchCat = category === "all" || p.cat === category;

      let matchStatus = true;
      if (status === "instock") matchStatus = !p.soldOut;
      if (status === "soldout") matchStatus = !!p.soldOut;

      return matchText && matchCat && matchStatus;
    });
  }, [mergedProducts, search, category, status]);

  const totalCount = mergedProducts.length;

  const updateAdmin = (mutator) => {
    setAdminState((prev) => {
      const next = mutator({ ...prev });
      writeAdminState(next);
      return next;
    });
  };

  const handleToggleSoldOut = (id) => {
    updateAdmin((state) => {
      const current = state[id] || {};
      state[id] = { ...current, soldOut: !current.soldOut };
      return state;
    });
  };

  const handleDelete = (id, name) => {
    const ok = window.confirm(
      `Are you sure you want to delete “${name}” from your admin list?\n(This is a soft delete only in this demo.)`
    );
    if (!ok) return;

    updateAdmin((state) => {
      const current = state[id] || {};
      state[id] = { ...current, deleted: true };
      return state;
    });
  };

  return (
    <main
      style={{
        padding: isMobile ? "80px 10px 16px" : "90px 20px 26px",
        background: "#f5f0fb",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: isMobile ? 8 : 10,
            justifyContent: "space-between",
            marginBottom: isMobile ? 10 : 14,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 18 : 20,
                color: "#3c274f",
                wordBreak: "break-word",
              }}
            >
              Products
            </h1>
            <p
              style={{
                marginTop: 6,
                fontSize: isMobile ? 11.5 : 13,
                color: "#7a6989",
              }}
            >
              Manage your resin pieces, categories, stock and sale status.
            </p>
            <p
              style={{
                marginTop: 2,
                fontSize: isMobile ? 10 : 11,
                color: "#a38fb5",
              }}
            >
              Showing {filtered.length} of {totalCount} products.
            </p>
          </div>

          <button
            type="button"
            style={{
              padding: isMobile ? "7px 12px" : "8px 14px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(90deg, #7c51a1, #4a2a73)",
              fontSize: isMobile ? 11.5 : 12,
              cursor: "pointer",
              color: "#fff",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
            onClick={() => nav("/admin/products/new")}
          >
            + Add product
          </button>
        </header>

        {/* FILTERS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {/* Search */}
          <div
            style={{
              flex: isMobile ? "1 1 100%" : "1 1 260px",
              minWidth: isMobile ? 0 : 200,
            }}
          >
            <input
              type="text"
              placeholder="Search by name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "8px 11px" : "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                fontSize: isMobile ? 12.5 : 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category filter */}
          <div
            style={{
              flex: isMobile ? "1 1 48%" : "0 0 190px",
              minWidth: isMobile ? 0 : 160,
            }}
          >
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "8px 11px" : "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                fontSize: isMobile ? 12.5 : 13,
                backgroundColor: "#fff",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div
            style={{
              flex: isMobile ? "1 1 48%" : "0 0 180px",
              minWidth: isMobile ? 0 : 160,
            }}
          >
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: isMobile ? "8px 11px" : "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,122,173,0.5)",
                fontSize: isMobile ? 12.5 : 13,
                backgroundColor: "#fff",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All statuses</option>
              <option value="instock">In stock</option>
              <option value="soldout">Sold out</option>
            </select>
          </div>

          <div
            style={{
              flex: isMobile ? "0 0 100%" : 1,
            }}
          />
        </div>

        {/* TABLE */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(148,122,173,0.25)",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 600, // allow scroll on very small screens
                borderCollapse: "collapse",
                fontSize: isMobile ? 12 : 13,
              }}
            >
              <thead style={{ background: "#f5effb" }}>
                <tr>
                  <Th>Product</Th>
                  {!isMobile && <Th>Category</Th>}
                  <Th align="right">Price</Th>
                  {!isMobile && <Th align="right">Sale</Th>}
                  <Th>Status</Th>
                  {!isMobile && <Th align="right">Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <Td colSpan={6} align="center">
                      No products match your current filters.
                    </Td>
                  </tr>
                )}

                {filtered.map((p) => {
                  const hasSale =
                    p.salePrice != null && p.salePrice !== undefined;
                  const statusKey = p.soldOut ? "soldout" : "instock";

                  return (
                    <Tr key={p.id}>
                      {/* Product info + THUMBNAIL */}
                      <Td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: isMobile ? 42 : 46,
                              height: isMobile ? 42 : 46,
                              borderRadius: 12,
                              overflow: "hidden",
                              background: "#eee",
                              flexShrink: 0,
                            }}
                          >
                            {p.image && (
                              <img
                                src={p.image}
                                alt={p.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#3c274f",
                                marginBottom: 2,
                                fontSize: isMobile ? 12.5 : 13,
                              }}
                            >
                              {p.name}
                            </div>
                            {p.short && (
                              <div
                                style={{
                                  fontSize: isMobile ? 10.5 : 11,
                                  color: "#7a6989",
                                  maxWidth: isMobile ? 180 : 260,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {p.short}
                              </div>
                            )}

                            {/* Mobile actions inside product cell */}
                            {isMobile && (
                              <div
                                style={{
                                  marginTop: 6,
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 6,
                                }}
                              >
                                <button
                                  type="button"
                                  style={{
                                    fontSize: 10.5,
                                    padding: "4px 7px",
                                    borderRadius: 999,
                                    border:
                                      "1px solid rgba(148,122,173,0.6)",
                                    background: "#fff",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    nav(
                                      `/admin/products/${encodeURIComponent(
                                        p.id
                                      )}/edit`
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  style={{
                                    fontSize: 10.5,
                                    padding: "4px 7px",
                                    borderRadius: 999,
                                    border: "none",
                                    background:
                                      "rgba(124,81,161,0.09)",
                                    color: "#4a2a73",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    handleToggleSoldOut(p.id)
                                  }
                                >
                                  {p.soldOut
                                    ? "Back in stock"
                                    : "Mark sold out"}
                                </button>

                                <button
                                  type="button"
                                  style={{
                                    fontSize: 10.5,
                                    padding: "4px 7px",
                                    borderRadius: 999,
                                    border: "none",
                                    background:
                                      "rgba(244,67,54,0.08)",
                                    color: "#b71c1c",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    handleDelete(p.id, p.name)
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Td>

                      {!isMobile && <Td>{p.cat || "—"}</Td>}

                      {/* Price / sale */}
                      <Td align="right">
                        {hasSale ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: "#4a2a73",
                              }}
                            >
                              ${p.salePrice.toFixed(2)}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "#a38fb5",
                                textDecoration: "line-through",
                              }}
                            >
                              ${p.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#4a2a73",
                            }}
                          >
                            ${p.price.toFixed(2)}
                          </span>
                        )}
                      </Td>

                      {/* Sale column */}
                      {!isMobile && (
                        <Td align="right">
                          {hasSale ? (
                            <span
                              style={{
                                fontSize: 12,
                                color: "#2e7d32",
                                fontWeight: 600,
                              }}
                            >
                              On sale
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 12,
                                color: "#7a6989",
                              }}
                            >
                              —
                            </span>
                          )}
                        </Td>
                      )}

                      {/* Status pill */}
                      <StatusTd status={statusKey}>
                        {p.soldOut ? "Sold out" : "In stock"}
                      </StatusTd>

                      {/* Desktop actions */}
                      {!isMobile && (
                        <Td align="right">
                          <button
                            type="button"
                            style={{
                              fontSize: 11,
                              padding: "5px 9px",
                              borderRadius: 999,
                              border:
                                "1px solid rgba(148,122,173,0.6)",
                              background: "#fff",
                              cursor: "pointer",
                              marginRight: 6,
                            }}
                            onClick={() =>
                              nav(
                                `/admin/products/${encodeURIComponent(
                                  p.id
                                )}/edit`
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            style={{
                              fontSize: 11,
                              padding: "5px 9px",
                              borderRadius: 999,
                              border: "none",
                              background: "rgba(124,81,161,0.09)",
                              color: "#4a2a73",
                              cursor: "pointer",
                              marginRight: 6,
                            }}
                            onClick={() => handleToggleSoldOut(p.id)}
                          >
                            {p.soldOut ? "Back in stock" : "Mark sold out"}
                          </button>

                          <button
                            type="button"
                            style={{
                              fontSize: 11,
                              padding: "5px 9px",
                              borderRadius: 999,
                              border: "none",
                              background: "rgba(244,67,54,0.08)",
                              color: "#b71c1c",
                              cursor: "pointer",
                            }}
                            onClick={() => handleDelete(p.id, p.name)}
                          >
                            Delete
                          </button>
                        </Td>
                      )}
                    </Tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------- Small UI helpers ------- */

function Th({ children, align = "left" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "8px 10px",
        fontWeight: 600,
        fontSize: 12,
        color: "#4a2a73",
        borderBottom: "1px solid rgba(148,122,173,0.25)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left", colSpan }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        textAlign: align,
        padding: "8px 10px",
        fontSize: 12,
        color: "#4f3d5c",
        borderBottom: "1px solid rgba(148,122,173,0.13)",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function Tr({ children }) {
  return <tr>{children}</tr>;
}

function StatusTd({ status, children }) {
  const map = {
    instock: {
      bg: "rgba(76,175,80,0.12)",
      color: "#1b5e20",
    },
    soldout: {
      bg: "rgba(244,67,54,0.12)",
      color: "#b71c1c",
    },
  };

  const sty = map[status] || {
    bg: "rgba(158,158,158,0.12)",
    color: "#424242",
  };

  return (
    <Td align="left">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 8px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          background: sty.bg,
          color: sty.color,
          textTransform: "capitalize",
        }}
      >
        {children}
      </span>
    </Td>
  );
}
