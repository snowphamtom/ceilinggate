/** Slim Drive KEEP/WATCH/NOISE/HOLD sample — typed for SPA. */
export type DriveBucketKey = "KEEP" | "WATCH" | "NOISE" | "HOLD";
export type DriveSample = { title: string; why: string; mimeKind?: string };

export type DriveBuckets = {
  report?: string;
  measured_at_ct?: string;
  counts: Record<DriveBucketKey, number>;
  samples: Record<DriveBucketKey, DriveSample[]>;
};

const driveBuckets: DriveBuckets = {
  "report": "DATA_TEST_SORT",
  "measured_at_ct": "2026-09-06 21:26 CT",
  "counts": {
    "KEEP": 40,
    "WATCH": 25,
    "NOISE": 25,
    "HOLD": 25
  },
  "samples": {
    "KEEP": [
      {
        "title": "CeilingGate-Forge-gates-clip-SHOW3.mp4",
        "why": "patent/commercial/canonical signal",
        "mimeKind": "other"
      },
      {
        "title": "CeilingGate-Forge-gates-clip-YT.mp4",
        "why": "patent/commercial/canonical signal",
        "mimeKind": "other"
      },
      {
        "title": "CeilingGate-Forge-gates-clip-HQ.mp4",
        "why": "patent/commercial/canonical signal",
        "mimeKind": "other"
      },
      {
        "title": "CeilingGate-Forge-gates-clip-HQ.mp4",
        "why": "patent/commercial/canonical signal",
        "mimeKind": "other"
      }
    ],
    "WATCH": [
      {
        "title": "Copy of ResidualGatesMathlib.lean",
        "why": "magpie/export dump or likely dupe",
        "mimeKind": "other"
      },
      {
        "title": "MAGPIE_outreach_email_2026-09-02.docx",
        "why": "magpie/export dump or likely dupe",
        "mimeKind": "other"
      },
      {
        "title": "MAGPIE_industry_one_pager_2026-09-02.docx",
        "why": "magpie/export dump or likely dupe",
        "mimeKind": "other"
      },
      {
        "title": "MAGPIE_RESIDUAL_INTEGRATED_2026-08-18",
        "why": "magpie/export dump or likely dupe",
        "mimeKind": "other"
      }
    ],
    "NOISE": [
      {
        "title": "Mirrored Truth \u2014 Plate 081: The Clearing of the ",
        "why": "mirror/ZzzZ/art/school/book-dupe pattern",
        "mimeKind": "other"
      },
      {
        "title": "Rotating_Mirror_Shadow_Ledger_2026-09-01",
        "why": "mirror/ZzzZ/art/school/book-dupe pattern",
        "mimeKind": "other"
      },
      {
        "title": "MIRRORED_TRUTH_PERFECTED_COMPLETE_HYBRID_MASTER_",
        "why": "mirror/ZzzZ/art/school/book-dupe pattern",
        "mimeKind": "pdf"
      },
      {
        "title": "MIRRORED_TRUTH_VOLUME_III_DERIVED_FROM_DRIVE.pdf",
        "why": "mirror/ZzzZ/art/school/book-dupe pattern",
        "mimeKind": "pdf"
      }
    ],
    "HOLD": [
      {
        "title": "Picture book .pdf",
        "why": "huge archive / uncertain package",
        "mimeKind": "pdf"
      },
      {
        "title": "Blank Layout.pages",
        "why": "huge archive / uncertain package",
        "mimeKind": "other"
      },
      {
        "title": "ZENITH_EMPIRICAL_PROTOCOL_CARVED_IVORY_COMPLETE_",
        "why": "huge archive / uncertain package",
        "mimeKind": "pdf"
      },
      {
        "title": "Saved Photos 2.pdf",
        "why": "huge archive / uncertain package",
        "mimeKind": "pdf"
      }
    ]
  }
};

export default driveBuckets;
