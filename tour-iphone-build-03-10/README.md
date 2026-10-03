# Physical iPhone checklist — 3 October 2026

Published at `/tour-iphone-build-03-10/`. This is a manual acceptance plan for the
requested build, not a report of completed device tests. Real phone memory,
mobile network behavior, physical finger interaction, and the requested TestFlight
startup measurement belong in the checkbox section. The ten simulator evidence fields are intentionally empty; their heading
does not assert that the missing films or tests were completed. The installed build
number must be entered before checking any case. Results are stored only in the
current browser, separately for each entered version.

No browser, simulator, build, or physical device was launched to prepare this
page. The small tests execute the actual checklist script with a minimal DOM
adapter; they verify persistence and error handling, not painted browser output
or any Take behavior.

```sh
bun test tour-iphone-build-03-10/app.test.mjs
```

## Source boundary

Take source reviewed at `d81a649213b7c651973abb63738ac3bfdcd09dc7`:

- `apps/mobile/src/components/profile/ProfilePhotoViewerContent.tsx`: greeting,
  replay, profile picture, and reduced motion.
- `apps/mobile/src/components/avatar/PhotoAvatarSheet.tsx` and `AvatarWizard.tsx`:
  entry into the 3D editor and saving.
- `apps/mobile/src/hooks/useIncomingShare.ts` and `lib/incoming-share.ts`: retain
  a pending share until configuration is known; consume once at launch,
  foreground return, or incoming URL.
- `apps/mobile/src/hooks/useFeedVideoAutoplay.ts` and
  `components/media/FeedAutoplayVideo.tsx`: Wi-Fi next-video preparation and
  first-frame behavior. Real player memory still requires device measurement.
- `apps/mobile/src/components/profile/ProfilePager.tsx` and the
  `react-native-pager-view@8.0.5.patch`: direct one-page transition and retargeting.
- `apps/mobile/src/queries/feed.queries.ts`: pages of 20. `feed-prefetch.ts`:
  next page requested at 15 remaining. `feed-take-images.ts`: the first displayed
  image or video poster per Take. The image queue starts two downloads at once.
- `apps/mobile/src/components/search/ExploreScreen.tsx` and
  `ExploreSearchFiltersSheet.tsx`: five tabs and independent sort/date/from filters.
- `apps/mobile/src/lib/push-destination.ts` and the API notification service:
  comment-like notification destination and highlighted comment.
- `apps/mobile/src/components/nav/HomeBottomBar.tsx` and
  `navigation/SlideTabs.tsx`: cancellation and held-finger behavior.

A3 was integrated by #3648 at `044823604c2b8f3b996b34485982e098492c7f35`:
requested width of 65% of the media area, reduced further if the height limit is
reached. Inclusion does not prove its native rendering; its simulator film field
remains empty. Final availability must be checked against the freshly regenerated
`../pas-dans-le-build/` report and the actual installed build.

The build owner requested inclusion of the font-startup change (#3411) and a
Release measurement on the real iPhone using TestFlight afterward. Record five
fully closed-app launches and compare with the previous version on the same
iPhone under the same conditions. This checklist does not claim a measured gain.
The new case uses the existing per-version storage without resetting prior cases
or filling simulator evidence fields.
