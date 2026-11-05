"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Button, Card, EmptyState, SearchableSelect, Table, Tabs } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function LinksView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ font: "var(--type-h1)" }}>
              קישורי הזמנה
            </h1>
            <p style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
              {v.lkListSub}
            </p>
          </div>
          <Button size="md" iconStart="plus" onClick={v.goLinkNew}>
            קישור חדש
          </Button>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px 16px", flexWrap: "wrap" }}>
          <Tabs variant="pills" tabs={v.lkTabs} value={v.lkTab} onChange={v.onLkTab} />
          {v.lkStaff && (
            <>
              <div style={css(v.lkFilterWrap)}>
                <SearchableSelect options={v.agentFilterOptions} value={v.lkAgentFilter} onChange={v.onLkAgentFilter} placeholder="כל הסוכנים" />
              </div>
            </>
          )}
        </div>
        {v.lkEmpty && (
          <>
            <Card padding="lg">
              <EmptyState icon="mail" title="אין קישורים פתוחים" description="קישור שנוצר ללקוח/ה יופיע כאן עד שינוצל, יבוטל או שתוקפו יפוג." />
            </Card>
          </>
        )}
        <div className={`hti-cq ${v.lkCqClass} ${v.cqMode}`}>
          {v.lkTableOn && (
            <>
              <div className="hti-cqt">
                <Card padding="none">
                  <div style={css(v.lkScroll)} className="hti-xscroll">
                    <div>
                      <Table columns={v.linkColumns} rows={v.linkRows} rowKey="id" emptyText="אין קישורים פתוחים" />
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
          {v.lkCardsOn && (
            <>
              <div style={{ flexDirection: "column", gap: "12px" }} className="hti-cqc">
                {(v.linkRows ?? []).map((k: VM, index: number) => (
                  <Fragment key={k.key ?? k.id ?? index}>
                    <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}>
                            ליד
                          </span>
                          <a href={k.leadUrl} target="_blank" rel="noopener" dir="ltr" style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "20px", fontVariantNumeric: "tabular-nums" }}>
                            {k.lead}
                          </a>
                        </div>
                        {" "}{k.badge}{" "}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "11px", borderTop: "1px solid var(--border-subtle)", font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
                        {v.lkStaff && (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                              <span style={{ color: "var(--text-tertiary)" }}>
                                סוכן/ת
                              </span>
                              <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                                {k.agentCell}
                              </span>
                            </div>
                          </>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                          <span style={{ color: "var(--text-tertiary)" }}>
                            {"נוצר ע\"י"}
                          </span>
                          <span>
                            {k.createdBy}{" ● "}
                            <span dir="ltr">
                              {k.createdAt}
                            </span>
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                          <span style={{ color: "var(--text-tertiary)" }}>
                            בתוקף עד
                          </span>
                          <span dir="ltr">
                            {k.expires}
                          </span>
                        </div>
                      </div>
                      {k.isOpen && (
                        <>
                          <div style={{ display: "flex" }}>
                            {k.actions}
                          </div>
                        </>
                      )}
                    </div>
                  </Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
