"use client";

 
import { Fragment } from "react";
import { Badge, Button, Card, FieldLabel, SearchableSelect, Table, Tabs, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function BookingsView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <h1 style={{ font: "var(--type-h1)" }}>
            פגישות
          </h1>
          {v.isDesktop && (
            <>
              <Tabs variant="pills" tabs={v.rangeTabs} value={v.range} onChange={v.onRange} />
            </>
          )}
        </div>
        {v.isPhone && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <Tabs variant="pills" tabs={v.rangeTabs} value={v.range} onChange={v.onRange} />
              <Button size="sm" variant={v.filterBtnVariant} iconStart="filter" onClick={v.toggleFilters}>
                סינון
              </Button>
            </div>
          </>
        )}
        {v.showFilters && (
          <>
            <Card padding="md">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "end" }}>
                <TextInput label="חיפוש" placeholder="שם לקוח/ה או מספר ליד" iconStart="search" value={v.search} onChange={v.onSearch} />
                <SearchableSelect label="סוכן/ת" options={v.agentFilterOptions} value={v.agentFilter} onChange={v.onAgentFilter} placeholder="כל הסוכנים" />
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)", position: "relative" }}>
                  <FieldLabel>
                    מתאריך
                  </FieldLabel>
                  <div>
                    {v.fromField}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)", position: "relative" }}>
                  <FieldLabel>
                    עד תאריך
                  </FieldLabel>
                  <div>
                    {v.toField}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
        <div className={`hti-cq hti-cq-bk ${v.cqMode}`}>
          <div className="hti-cqt">
            <Card padding="none">
              <div style={css(v.tableScroll)} className="hti-xscroll">
                <div>
                  <Table columns={v.bookingColumns} rows={v.bookingRows} rowKey="id" onRowClick={v.goDetail} sortKey={v.sortKey} sortDir={v.sortDir} onSort={v.onSort} emptyText="לא נמצאו פגישות בטווח הזה" />
                </div>
              </div>
            </Card>
          </div>
          <div style={{ flexDirection: "column", gap: "12px" }} className="hti-cqc">
            {(v.bookingCards ?? []).map((b: VM, index: number) => (
              <Fragment key={b.key ?? b.id ?? index}>
                <div onClick={b.go} style={{ background: "var(--surface-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "0" }}>
                      <span dir="ltr" style={{ display: "inline-block", whiteSpace: "nowrap", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "20px", color: "var(--text-primary)" }}>
                        {b.time}
                      </span>
                      <span style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                        {b.dow}{" ● "}
                        <span dir="ltr">
                          {b.date}
                        </span>
                      </span>
                    </div>
                    <Badge tone={b.statusTone} icon={b.statusIcon} size="sm">
                      {b.statusLabel}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px", paddingTop: "11px", borderTop: "1px solid var(--border-subtle)" }}>
                    <span style={{ font: "var(--type-label)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {b.customer}
                    </span>
                    <span style={{ color: "var(--gray-300)", fontSize: "10px", lineHeight: "1" }}>
                      ●
                    </span>
                    <a href={b.leadUrl} target="_blank" rel="noopener" dir="ltr" onClick={v.stop} style={{ font: "var(--type-body-sm)", fontVariantNumeric: "tabular-nums" }}>
                      {b.lead}
                    </a>
                    <span style={{ color: "var(--gray-300)", fontSize: "10px", lineHeight: "1" }}>
                      ●
                    </span>
                    <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {b.agent}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    {b.remote && (
                      <>
                        <span style={{ width: "26px", height: "26px", flex: "none", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--teal-50)", color: "var(--teal-700)" }}>
                          {v.videoIcon}
                        </span>
                      </>
                    )}
                    {b.onsite && (
                      <>
                        <span style={{ width: "26px", height: "26px", flex: "none", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--purple-50)", color: "var(--purple-500)" }}>
                          {v.pinIcon}
                        </span>
                      </>
                    )}
                    <span style={{ font: "var(--type-body-sm)", color: "var(--text-primary)", textWrap: "pretty" }}>
                      {b.where}
                    </span>
                    {b.remote && (
                      <>
                        <span style={{ marginInlineStart: "auto", display: "flex" }}>
                          {b.teams}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
